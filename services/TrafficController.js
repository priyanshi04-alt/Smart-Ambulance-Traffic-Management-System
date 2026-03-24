const logService = require('./LogService');
const predictiveRouting = require('./PredictiveRoutingService');

/**
 * Intelligent Traffic Decision Engine & Execution Layer
 */
class TrafficController {
    constructor() {
        this.io = null;
        this.state = { north: 'green', south: 'green', east: 'red', west: 'red' };
        this.density = { north: 'low', south: 'low', east: 'low', west: 'low' };

        this.overrideManual = false;  
        this.overrideAutoSiren = false; 
        this.overrideAutoGPS = false; 

        this.ambulanceDirection = null;
        this.currentPhase = 'NS'; 
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.timingMap = { low: 10, medium: 20, high: 30 };
        this.hardwareStatus = { esp32: 'connected', sirenSensor: 'active', controller: 'running' };
        this.inYellowTransition = false;
    }

    init(io) {
        this.io = io;
        this.startCycle();
    }

    get isEmergencyMode() {
        return this.overrideManual || this.overrideAutoSiren || this.overrideAutoGPS;
    }

    getMaxDensityTiming(dir1, dir2) {
        return Math.max(this.timingMap[this.density[dir1]], this.timingMap[this.density[dir2]]);
    }

    startCycle() {
        if (this.isEmergencyMode || this.inYellowTransition) return;
        this.setSignalState(this.currentPhase === 'NS' ? 'green' : 'red', 'NS');
        this.setSignalState(this.currentPhase === 'EW' ? 'green' : 'red', 'EW');
        const greenTime = this.currentPhase === 'NS' 
            ? this.getMaxDensityTiming('north', 'south') 
            : this.getMaxDensityTiming('east', 'west');
        this.timeRemaining = greenTime;
        this.broadcastState();
        this.runTimer();
    }

    runTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isEmergencyMode || this.inYellowTransition) return;
            this.timeRemaining--;
            if (this.timeRemaining <= 0) this.transitionCycle();
        }, 1000);
    }

    transitionCycle() {
        if (this.isEmergencyMode || this.inYellowTransition) return;
        this.inYellowTransition = true;
        this.setSignalState('yellow', this.currentPhase);
        this.broadcastState();
        setTimeout(() => {
            this.inYellowTransition = false;
            if (this.isEmergencyMode) return;
            this.currentPhase = this.currentPhase === 'NS' ? 'EW' : 'NS';
            this.startCycle();
        }, 3000); 
    }

    setSignalState(color, phase) {
        if (phase === 'NS') {
            this.state.north = color; this.state.south = color;
        } else if (phase === 'EW') {
            this.state.east = color; this.state.west = color;
        }
    }

    // 1. Manual Admin Override
    activateEmergencyMode(direction) {
        logService.addLog(`MANUAL OVERRIDE: Green corridor forced ${direction}.`, 'warning');
        this.overrideManual = true;
        this._executeEmergencyState(direction);
    }

    deactivateEmergencyMode() {
        logService.addLog(`Manual Override Cancelled. Restoring predictive/normal control.`, 'info');
        this.overrideManual = false;
        this._resolveState();
    }

    // 2. Auto Siren Trigger
    activateAutoSiren(direction) {
        if (this.overrideManual) return; 
        if (!this.overrideAutoSiren) {
            logService.addLog(`ACOUSTIC TRIGGER: Verified siren detected from ${direction}. Corridor active.`, 'warning');
            this.overrideAutoSiren = true;
            this._executeEmergencyState(direction);
        }
        if(this.sirenTimeout) clearTimeout(this.sirenTimeout);
        this.sirenTimeout = setTimeout(() => {
            this.overrideAutoSiren = false;
            logService.addLog(`Acoustic signal lost for 30s. Releasing siren corridor lock.`, 'info');
            this._resolveState();
        }, 30000);
    }

    // 3. Predictive Traffic Control Execution Layer
    processPredictiveTelemetry(gpsData) {
        // Fetch raw Computation Layer ETAs (current + next 2)
        const priorityList = predictiveRouting.evaluateTrajectory(gpsData);
        
        if (priorityList.length > 0) {
            const nearestNode = priorityList[0]; 
            const executionState = this._calculateExecutionState(nearestNode.eta);

            if (executionState !== 'NORMAL') {
                if (!this.overrideManual && !this.overrideAutoSiren) {
                     if (!this.overrideAutoGPS) {
                         logService.addLog(`PREDICTIVE EXECUTION: Assigned ${executionState} state for ETA ${nearestNode.eta.toFixed(1)}s at ${nearestNode.address}.`, 'info');
                     }
                     this.overrideAutoGPS = true;
                     this._executeEmergencyState('south'); 
                }
            } else {
                 this.overrideAutoGPS = false;
                 this._resolveState();
            }
        } else {
             this.overrideAutoGPS = false;
             this._resolveState();
        }
    }

    _calculateExecutionState(etaSeconds) {
        if (etaSeconds < 5) return 'GREEN';
        if (etaSeconds < 15) return 'PREPARE';
        if (etaSeconds < 30) return 'READY';
        return 'NORMAL';
    }

    _executeEmergencyState(direction) {
        this.ambulanceDirection = direction;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.state.north = 'red'; this.state.south = 'red';
        this.state.east = 'red'; this.state.west = 'red';
        
        if (direction === 'north' || direction === 'south') {
             this.state.north = 'green'; this.state.south = 'green';
        } else if (direction === 'east' || direction === 'west') {
             this.state.east = 'green'; this.state.west = 'green';
        }
        
        this.broadcastState();
        if (this.io) this.io.emit('emergency-alert', { active: true, direction });
    }

    _resolveState() {
        if (this.overrideManual) return;
        if (this.overrideAutoSiren) {
            this._executeEmergencyState('south'); 
            return;
        }
        if (this.overrideAutoGPS) {
            this._executeEmergencyState('south');
            return;
        }

        this.ambulanceDirection = null;
        if (this.io) this.io.emit('emergency-alert', { active: false });
        this.startCycle();
    }

    updateDensity(direction, level) {
        if (this.timingMap[level]) {
            this.density[direction] = level;
            if (this.io) this.io.emit('density-state', this.density);
            return true;
        }
        return false;
    }

    getState() {
        return {
            signals: this.state,
            emergencyMode: this.isEmergencyMode,
            ambulanceDirection: this.ambulanceDirection,
            hardware: this.hardwareStatus,
            currentPhase: this.currentPhase,
            timeRemaining: this.timeRemaining
        };
    }
    
    getDestiny() { return this.density; }

    broadcastState() {
        if (this.io) {
            this.io.emit('traffic-state', this.getState());
            const hwSync = require('./HardwareSyncService');
            hwSync.sendCommand('ESP32-NODE-01', this.state);
        }
    }
}

module.exports = new TrafficController();
