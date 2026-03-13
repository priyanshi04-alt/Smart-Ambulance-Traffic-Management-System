const logService = require('./LogService');

class TrafficController {
    constructor() {
        this.io = null;
        
        // Directions: N (North), S (South), E (East), W (West)
        this.state = {
            north: 'green',
            south: 'green',
            east: 'red',
            west: 'red'
        };

        this.density = {
            north: 'low',
            south: 'low',
            east: 'low',
            west: 'low'
        };

        this.emergencyMode = false;
        this.ambulanceDirection = null;
        
        this.currentPhase = 'NS'; // NS (North-South) or EW (East-West)
        this.timer = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
        
        // Density timing map (seconds)
        this.timingMap = {
            low: 10,
            medium: 20,
            high: 30
        };
        
        this.hardwareStatus = {
            esp32: 'connected',
            sirenSensor: 'active',
            controller: 'running'
        };
    }

    init(io) {
        this.io = io;
        this.startCycle();
    }

    getMaxDensityTiming(dir1, dir2) {
        const t1 = this.timingMap[this.density[dir1]];
        const t2 = this.timingMap[this.density[dir2]];
        return Math.max(t1, t2);
    }

    startCycle() {
        if (this.emergencyMode) return;
        
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
            if (this.emergencyMode) return;
            
            this.timeRemaining--;
            
            // Broadcast timer tick if needed, or just let clients handle local countdown sync
            
            if (this.timeRemaining <= 0) {
                this.transitionCycle();
            }
        }, 1000);
    }

    transitionCycle() {
        if (this.emergencyMode) return;
        
        // Transition to Yellow before switching
        this.setSignalState('yellow', this.currentPhase);
        this.broadcastState();
        logService.addLog(`${this.currentPhase} signal transitioning (Yellow)`, 'info');
        
        setTimeout(() => {
            if (this.emergencyMode) return;
            
            this.currentPhase = this.currentPhase === 'NS' ? 'EW' : 'NS';
            
            logService.addLog(`${this.currentPhase === 'NS' ? 'North-South' : 'East-West'} is now GREEN`, 'info');
            this.startCycle();
        }, 3000); // 3 seconds yellow time
    }

    setSignalState(color, phase) {
        if (phase === 'NS') {
            this.state.north = color;
            this.state.south = color;
        } else if (phase === 'EW') {
            this.state.east = color;
            this.state.west = color;
        }
    }

    activateEmergencyMode(direction) {
        this.emergencyMode = true;
        this.ambulanceDirection = direction;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // All red
        this.state.north = 'red';
        this.state.south = 'red';
        this.state.east = 'red';
        this.state.west = 'red';
        
        // Ambulance dir green
        if (direction === 'north' || direction === 'south') {
             this.state.north = 'green';
             this.state.south = 'green';
        } else if (direction === 'east' || direction === 'west') {
             this.state.east = 'green';
             this.state.west = 'green';
        }
        
        logService.addLog(`EMERGENCY MODE ACTIVATED: Green corridor for ${direction}`, 'warning');
        this.broadcastState();
        this.io.emit('emergency-alert', { active: true, direction });
    }

    deactivateEmergencyMode() {
        this.emergencyMode = false;
        this.ambulanceDirection = null;
        logService.addLog(`Emergency Mode Disabled. Resuming normal traffic cycle.`, 'info');
        this.io.emit('emergency-alert', { active: false });
        this.startCycle();
    }

    updateDensity(direction, level) {
        if (this.timingMap[level]) {
            this.density[direction] = level;
            logService.addLog(`Traffic density for ${direction} changed to ${level}`, 'info');
            this.io.emit('density-state', this.density);
            return true;
        }
        return false;
    }

    getState() {
        return {
            signals: this.state,
            emergencyMode: this.emergencyMode,
            ambulanceDirection: this.ambulanceDirection,
            hardware: this.hardwareStatus,
            currentPhase: this.currentPhase,
            timeRemaining: this.timeRemaining
        };
    }
    
    getDestiny() {
        return this.density;
    }

    broadcastState() {
        if (this.io) {
            this.io.emit('traffic-state', this.getState());
        }
    }
}

module.exports = new TrafficController();
