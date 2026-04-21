const logService = require('./LogService');
const predictiveRouting = require('./PredictiveRoutingService');
const hwSync = require('./HardwareSyncService');

/**
 * Intelligent Traffic Decision Engine & Execution Layer (Hybrid Multi-Node)
 */
class TrafficController {
    constructor() {
        this.io = null;
        
        // Multi-Node Architecture (Hybrid Physical + Simulated)
        this.intersections = {
            'JUNC-01': { type: 'physical', state: { north: 'green', south: 'green', east: 'red', west: 'red' } },
            'JUNC-02': { type: 'simulated', state: { north: 'green', south: 'green', east: 'red', west: 'red' } },
            'JUNC-03': { type: 'simulated', state: { north: 'green', south: 'green', east: 'red', west: 'red' } }
        };

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
        this.setSignalState('ALL', this.currentPhase === 'NS' ? 'green' : 'red', 'NS');
        this.setSignalState('ALL', this.currentPhase === 'EW' ? 'green' : 'red', 'EW');
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
        this.setSignalState('ALL', 'yellow', this.currentPhase);
        this.broadcastState();
        setTimeout(() => {
            this.inYellowTransition = false;
            if (this.isEmergencyMode) return;
            this.currentPhase = this.currentPhase === 'NS' ? 'EW' : 'NS';
            this.startCycle();
        }, 3000); 
    }

    setSignalState(nodeId, color, phase) {
        const updateNode = (id) => {
            if (phase === 'NS') {
                this.intersections[id].state.north = color; this.intersections[id].state.south = color;
            } else if (phase === 'EW') {
                this.intersections[id].state.east = color; this.intersections[id].state.west = color;
            }
        };

        if (nodeId === 'ALL') {
            Object.keys(this.intersections).forEach(id => updateNode(id));
        } else if (this.intersections[nodeId]) {
            updateNode(nodeId);
        }
    }

    // 1. Manual Admin Override
    activateEmergencyMode(direction) {
        logService.addLog(`MANUAL OVERRIDE: Green corridor forced ${direction} on ALL nodes.`, 'warning');
        this.overrideManual = true;
        this._executeEmergencyState('ALL', direction, 'GREEN');
        this.broadcastState();
    }

    deactivateEmergencyMode() {
        logService.addLog(`Manual Override Cancelled. Restoring predictive/normal control.`, 'info');
        this.overrideManual = false;
        this._resolveState();
    }

    // 2. Auto Siren Trigger & Cooldown Defense Pipeline
    activateAutoSiren(direction) {
        if (this.overrideManual) return; 
        if (!this.overrideAutoSiren) {
            logService.addLog(`ACOUSTIC TRIGGER: Verified siren detected from ${direction}. Corridor active on real node (JUNC-01).`, 'warning');
            this.overrideAutoSiren = true;
            this._executeEmergencyState('JUNC-01', direction, 'GREEN');
            this.broadcastState();
        } else {
            // Prevent repeated triggering during active acoustic block
            logService.addLog(`Redundant acoustic trigger gracefully ignored due to active traffic lock.`, 'info');
        }

        if(this.sirenTimeout) clearTimeout(this.sirenTimeout);
        
        // Auto-Reset Protocol after simulated passing (30s completion logic)
        this.sirenTimeout = setTimeout(() => {
            this.handleCorridorCompletion();
        }, 30000); 
    }

    handleCorridorCompletion() {
        this.overrideAutoSiren = false;
        logService.addLog(`AMBULANCE PASSED: Active corridor dismantled. Re-instating normalized flow cycle.`, 'info');
        this._resolveState();
    }

    // 3. Predictive Traffic Control Execution Layer
    processPredictiveTelemetry(gpsData) {
        const priorityList = predictiveRouting.evaluateTrajectory(gpsData);
        
        let hasActiveGPSOverride = false;

        priorityList.forEach(node => {
            const executionState = this._calculateExecutionState(node.eta);
            
            if (executionState !== 'NORMAL') {
                hasActiveGPSOverride = true;
                if (!this.overrideManual && !this.overrideAutoSiren) {
                    this._executeEmergencyState(node.nodeId, 'south', executionState); 
                    
                    if (!this.overrideAutoGPS) {
                        logService.addLog(`PREDICTIVE EXECUTION: Assigned ${executionState} state for ETA ${node.eta.toFixed(1)}s at ${node.address} (${node.nodeId}).`, 'info');
                    }
                }
            } else if (!this.overrideManual && !this.overrideAutoSiren) {
                this._restoreNodeToCycle(node.nodeId);
            }
        });

        if (hasActiveGPSOverride && !this.overrideManual && !this.overrideAutoSiren) {
            this.overrideAutoGPS = true;
            this.broadcastState();
        } else if (!hasActiveGPSOverride && this.overrideAutoGPS) {
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

    _executeEmergencyState(nodeId, direction, stage) {
        this.ambulanceDirection = direction;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const applyStage = (id) => {
            if (stage === 'GREEN' || stage === 'PREPARE') {
                this.intersections[id].state.north = 'red'; this.intersections[id].state.south = 'red';
                this.intersections[id].state.east = 'red'; this.intersections[id].state.west = 'red';
                
                if (direction === 'north' || direction === 'south') {
                     this.intersections[id].state.north = 'green'; this.intersections[id].state.south = 'green';
                } else if (direction === 'east' || direction === 'west') {
                     this.intersections[id].state.east = 'green'; this.intersections[id].state.west = 'green';
                }
            } else if (stage === 'READY') {
                this.intersections[id].state.north = 'yellow'; this.intersections[id].state.south = 'yellow';
                this.intersections[id].state.east = 'yellow'; this.intersections[id].state.west = 'yellow';
            }
        };

        if (nodeId === 'ALL') {
            Object.keys(this.intersections).forEach(id => applyStage(id));
        } else if (this.intersections[nodeId]) {
            applyStage(nodeId);
        }
    }

    _restoreNodeToCycle(nodeId) {
        this.setSignalState(nodeId, this.currentPhase === 'NS' ? 'green' : 'red', 'NS');
        this.setSignalState(nodeId, this.currentPhase === 'EW' ? 'green' : 'red', 'EW');
    }

    _resolveState() {
        if (this.overrideManual) return;
        if (this.overrideAutoSiren) {
            this._executeEmergencyState('JUNC-01', 'south', 'GREEN'); 
            this.broadcastState();
            return;
        }
        if (this.overrideAutoGPS) {
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
        // BACKWARDS COMPATIBILITY FOR UI
        return {
            signals: this.intersections['JUNC-01'].state, // Preserves visual grid compatibility
            extendedNetwork: this.intersections,          
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
            // Sync ONLY the physical node to the ESP32!
            hwSync.sendCommand('ESP32-NODE-01', this.intersections['JUNC-01'].state);
        }
    }
}

module.exports = new TrafficController();
