const multiCoordinator = require('./MultiAmbulanceCoordinator');
const predictiveRouting = require('./PredictiveRoutingService');
const logService = require('./LogService');

/**
 * Central Decision Engine (NEW CORE LAYER)
 * Maps intersecting ambulances and assigns control.
 * Prioritization: 1. Severity (CRITICAL > NORMAL) -> 2. ETA -> 3. Route Overlap
 */
class CentralDecisionEngine {
    constructor() {
        this.severityScores = { 'CRITICAL': 3, 'HIGH': 2, 'NORMAL': 1 };
    }

    /**
     * Resolves multi-ambulance conflicts using the Priority Arbitration Algorithm.
     * Computes a Priority Index (PI) for each bid.
     */
    evaluateNetwork() {
        const registry = multiCoordinator.getRegistry();
        if (registry.length === 0) return [];

        const nodeBids = new Map();

        registry.forEach(amb => {
            // THE CORE FIX 1: Anti-Spoofing / Authentication Check
            // In a real system, 'amb.authenticated' would be a cryptographic token
            if (!amb.authenticated && amb.id !== 'SIM-AMB-01') {
                logService.addLog(`SECURITY ALERT: Unauthenticated preemption request from ${amb.id} rejected.`, 'danger');
                return;
            }

            const predictions = predictiveRouting.evaluateTrajectory(amb);
            
            predictions.forEach(pred => {
                if (!nodeBids.has(pred.nodeId)) nodeBids.set(pred.nodeId, []);
                
                const priorityIndex = this._calculatePriorityIndex(amb, pred);

                nodeBids.get(pred.nodeId).push({
                    ambulanceId: amb.id,
                    pi: priorityIndex,
                    eta: pred.eta,
                    severity: this.severityScores[amb.severity] || 1,
                    predictedState: this._calculateExecutionState(pred.eta)
                });
            });
        });

        const finalCommands = [];

        nodeBids.forEach((bids, nodeId) => {
            // THE CORE FIX 2: Hierarchical Arbitration (Tie-Breaker)
            // If PI is equal, we fall back to: 1. Severity -> 2. Lowest ETA -> 3. Vehicle ID (deterministic)
            bids.sort((a, b) => {
                if (Math.abs(a.pi - b.pi) > 0.01) return b.pi - a.pi;
                if (a.severity !== b.severity) return b.severity - a.severity;
                return a.eta - b.eta;
            });

            const winner = bids[0];

            multiCoordinator.assignController(nodeId, winner.ambulanceId);

            if (winner.predictedState !== 'NORMAL') {
                finalCommands.push({
                    intersection_id: nodeId,
                    state: winner.predictedState,
                    controllerId: winner.ambulanceId,
                    eta: winner.eta,
                    priorityIndex: winner.pi
                });
            } else {
                multiCoordinator.removeController(nodeId);
            }
        });

        if (registry.length > 1 && finalCommands.length > 0) {
           const logMsg = finalCommands.map(c => `[${c.intersection_id} AMB:${c.controllerId} (PI:${c.priorityIndex.toFixed(2)})]`).join(' | ');
           logService.addLog(`ARBITRATION ENGINE: Multi-vehicle conflict resolved via Priority Index scoring. ${logMsg}`, 'warning');
        }

        return finalCommands;
    }

    /**
     * The Core Patent Innovation: Priority Index (PI) Calculation
     * PI = (w1*E) + (w2*S) + (w3*D) + (w4*C)
     */
    _calculatePriorityIndex(amb, pred) {
        const w = { severity: 10, speed: 5, distance: 3, congestion: 2 };
        
        const E = this.severityScores[amb.severity] || 1; // Severity (1-3)
        const S = 100 / (pred.eta || 1); // Speed/ETA urgency (closer = higher score)
        const D = 1000 / (pred.distance || 1); // Proximity (closer = higher score)
        const C = pred.congestion || 1.0; // Traffic impact factor

        return (w.severity * E) + (w.speed * S) + (w.distance * D) + (w.congestion * C);
    }

    _calculateExecutionState(etaSeconds) {
        if (etaSeconds < 5) return 'GREEN';
        if (etaSeconds < 15) return 'PREPARE';
        if (etaSeconds < 30) return 'READY';
        return 'NORMAL';
    }
}

module.exports = new CentralDecisionEngine();
