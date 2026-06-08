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
        }, 5000); 
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
        logService.addLog(`[ACTION: MASTER OVERRIDE] Admin forced GREEN CORRIDOR for ${direction.toUpperCase()}-bound traffic across ALL nodes (JUNC-01, JUNC-02, JUNC-03).`, 'warning');
        this.overrideManual = true;
        this._executeEmergencyState('ALL', direction, 'GREEN');
        if (this.io) this.io.emit('emergency-alert', { active: true, direction, message: `Admin manual override activated. Forcing green corridor for ${direction} bound traffic on all city nodes.` });
        this.broadcastState();
    }

    deactivateEmergencyMode() {
        logService.addLog(`[ACTION: MASTER RELEASE] Admin cancelled Manual Override. System restoring normal cyclic control across ALL nodes.`, 'info');
        this.overrideManual = false;
        this._resolveState();
    }

    // 2. Auto Siren Trigger & Cooldown Defense Pipeline
    activateAutoSiren(direction) {
        if (this.overrideManual) return; 
        if (!this.overrideAutoSiren) {
            logService.addLog(`[ACTION: HARDWARE TRIGGER] Verified Acoustic Siren detected from ${direction.toUpperCase()}. Forcing GREEN CORRIDOR on physical node [JUNC-01].`, 'warning');
            this.overrideAutoSiren = true;
            this._executeEmergencyState('JUNC-01', direction, 'GREEN');
            if (this.io) this.io.emit('emergency-alert', { active: true, direction, message: `Emergency siren detected. Physical hardware node JUNC-01 has locked traffic for ${direction} approach.` });
            this.broadcastState();

            // Auto-Reset Protocol after passing (15s completion logic)
            // Placed inside the block so duplicate triggers don't extend the lock forever!
            if(this.sirenTimeout) clearTimeout(this.sirenTimeout);
            this.sirenTimeout = setTimeout(() => {
                this.handleCorridorCompletion();
            }, 15000); 
        } else {
            // Prevent repeated triggering during active acoustic block
            logService.addLog(`[STATUS: COOLDOWN] Ignoring duplicate acoustic trigger from ${direction.toUpperCase()}. Node [JUNC-01] is already locked in emergency state.`, 'info');
        }
    }

    handleCorridorCompletion() {
        this.overrideAutoSiren = false;
        logService.addLog(`[STATUS: CORRIDOR CLEARED] 30s hardware timeout reached for [JUNC-01]. Dismantling emergency state and restoring standard flow.`, 'info');
        this._resolveState();
    }

    // 3. Predictive Traffic Control Execution Layer
    processPredictiveTelemetry(gpsData) {
        const priorityList = predictiveRouting.evaluateTrajectory(gpsData);
        
        let hasActiveGPSOverride = false;

        priorityList.forEach(node => {
            const intersection = this.intersections[node.nodeId];
            
            // Trajectory Abandonment Check
            if (intersection.lastDistance && node.distance > (intersection.lastDistance + 2)) {
                if (intersection.inEmergency) {
                    logService.addLog(`[ALERT: ROUTE ABANDONED] Ambulance deviated near node [${node.nodeId}]. Distance increased unexpectedly. Aborting preemptive green.`, 'warning');
                    this.confirmClearance(node.nodeId);
                    return;
                }
            }
            intersection.lastDistance = node.distance;

            // Starvation Check
            if (this.checkStarvation(node.nodeId)) return;

            if (node.distance < 5 || node.eta < 0.5) {
                this.confirmClearance(node.nodeId);
                return;
            }

            // THE DIAMOND FIX: Confidence-Scaled Staging
            // We pass the confidence score (0.0 to 1.0) to the state machine
            logService.addLog(`[GPS TELEMETRY] Node [${node.nodeId}] ETA: ${node.eta.toFixed(1)}s. Execution Confidence: ${((node.confidence || 1.0) * 100).toFixed(0)}%`, 'debug');
            const executionState = this._calculateExecutionState(node.nodeId, node.eta, node.confidence || 1.0);
            
            if (executionState !== 'NORMAL') {
                hasActiveGPSOverride = true;
                if (!this.overrideManual && !this.overrideAutoSiren) {
                    this._executeEmergencyState(node.nodeId, 'south', executionState); 
                    if (this.io && executionState === 'GREEN') {
                        this.io.emit('emergency-alert', { active: true, direction: 'south', message: `Predictive AI activated. Ambulance approaching node ${node.nodeId}. Activating green corridor.` });
                    }
                }
            }
        });
        
        // ... rest of logic
    }

    /**
     * Confidence-Scaled State Machine
     * Caps the aggressiveness of the preemption based on predictive reliability.
     */
    _calculateExecutionState(nodeId, newEta, confidence) {
        const node = this.intersections[nodeId];
        const prevState = node.lastPredictedState || 'NORMAL';
        
        let targetState = 'NORMAL';
        if (newEta < 5) targetState = 'GREEN';
        else if (newEta < 15) targetState = 'PREPARE';
        else if (newEta < 30) targetState = 'READY';

        // THE CORE LOGIC: Scale aggressiveness
        // If confidence is low, we NEVER go to GREEN. We stay at READY/PREPARE.
        if (confidence < 0.6 && (targetState === 'GREEN' || targetState === 'PREPARE')) {
            targetState = 'READY'; // Downgrade to cautious state
        } else if (confidence < 0.4) {
            targetState = 'NORMAL'; // Reject low-confidence predictions
        }

        // Apply Hysteresis
        if (this._isStateHigher(prevState, targetState)) {
            const buffer = 3;
            if (newEta < (this._getThreshold(prevState) + buffer)) {
                targetState = prevState;
            }
        }

        node.lastPredictedState = targetState;
        return targetState;
    }

    /**
     * Starvation Prevention Logic
     * Prevents 'Infinitely Green' corridors from blocking the city.
     */
    checkStarvation(nodeId) {
        const MAX_HOLD = 60000; // 60 Seconds
        const RECOVERY_TIME = 15000; // 15 Seconds mandatory break
        
        const node = this.intersections[nodeId];
        if (!node.lockStartTime) return false;

        const duration = Date.now() - node.lockStartTime;
        
        if (duration > MAX_HOLD) {
            logService.addLog(`[ALERT: STARVATION DETECTED] Node [${nodeId}] locked in GREEN for >60s! Forcing immediate civilian recovery window (15s).`, 'danger');
            this.confirmClearance(nodeId);
            node.recoveryUntil = Date.now() + RECOVERY_TIME;
            return true;
        }

        if (node.recoveryUntil && Date.now() < node.recoveryUntil) {
            return true; // Still in recovery window
        }

        return false;
    }

    /**
     * Asynchronous Dynamic Release
     * Immediately reverts a specific node to normal cycle once vehicle clearance is confirmed.
     */
    confirmClearance(nodeId) {
        if (this.intersections[nodeId].inEmergency) {
            logService.addLog(`[STATUS: CLEARANCE CONFIRMED] Ambulance successfully passed node [${nodeId}]. Releasing intersection asynchronously.`, 'success');
            this.intersections[nodeId].inEmergency = false;
            this.intersections[nodeId].lockStartTime = null; // Reset starvation timer
            this._restoreNodeToCycle(nodeId);
            this.broadcastState();
        }
    }

    /**
     * Hysteresis-Based Signal Stabilization
     * Prevents signal 'flickering' by adding a temporal buffer to state transitions.
     */
    _calculateExecutionState(nodeId, newEta) {
        const node = this.intersections[nodeId];
        const prevState = node.lastPredictedState || 'NORMAL';
        
        let newState = 'NORMAL';
        if (newEta < 5) newState = 'GREEN';
        else if (newEta < 15) newState = 'PREPARE';
        else if (newEta < 30) newState = 'READY';

        // Apply Hysteresis: If we are in a higher state (e.g., GREEN), 
        // don't drop back to a lower state (e.g., PREPARE) unless the ETA is significantly higher (+3s)
        if (this._isStateHigher(prevState, newState)) {
            const buffer = 3; // 3-second hysteresis window
            if (newEta < (this._getThreshold(prevState) + buffer)) {
                newState = prevState;
            }
        }

        node.lastPredictedState = newState;
        return newState;
    }

    _isStateHigher(prev, next) {
        const rank = { 'NORMAL': 0, 'READY': 1, 'PREPARE': 2, 'GREEN': 3 };
        return rank[prev] > rank[next];
    }

    _getThreshold(state) {
        const thresholds = { 'GREEN': 5, 'PREPARE': 15, 'READY': 30, 'NORMAL': 999 };
        return thresholds[state];
    }

    _executeEmergencyState(nodeId, direction, stage) {
        this.ambulanceDirection = direction;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const applyStage = (id) => {
            if (stage === 'GREEN' || stage === 'PREPARE') {
                this.intersections[id].inEmergency = true;
                if (!this.intersections[id].lockStartTime) {
                    this.intersections[id].lockStartTime = Date.now();
                }
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
            
            // Broadcast to the raw WebSocket (ESP32 LEDs)
            if (typeof global.broadcastToHardware === 'function') {
                global.broadcastToHardware(this.getState());
            }
        }
    }
}

module.exports = new TrafficController();
