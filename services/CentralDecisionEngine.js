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
     * Resolves multi-ambulance conflicts for a given set of nodes.
     * Evaluates EVERY active ambulance's ETA to EVERY node to assign locks.
     * @returns {Array} List of node commands including controllerIds
     */
    evaluateNetwork() {
        const registry = multiCoordinator.getRegistry();
        if (registry.length === 0) return [];

        const nodeBids = new Map(); // nodeId -> [ { ambulanceId, severityScore, eta } ]

        // Gather ETAs for all ambulances
        registry.forEach(amb => {
            const predictions = predictiveRouting.evaluateTrajectory(amb);
            
            predictions.forEach(pred => {
                if (!nodeBids.has(pred.nodeId)) nodeBids.set(pred.nodeId, []);
                
                nodeBids.get(pred.nodeId).push({
                    ambulanceId: amb.id,
                    severityScore: this.severityScores[amb.severity] || 1,
                    eta: pred.eta,
                    predictedState: this._calculateExecutionState(pred.eta)
                });
            });
        });

        const finalCommands = [];

        // Resolve bids per node
        nodeBids.forEach((bids, nodeId) => {
            // Priority Sort: Highest Severity First, then Lowest ETA
            bids.sort((a, b) => {
                if (a.severityScore !== b.severityScore) {
                    return b.severityScore - a.severityScore; // Descending severity
                }
                return a.eta - b.eta; // Ascending ETA
            });

            const winner = bids[0];

            // Assign control lock conceptually
            multiCoordinator.assignController(nodeId, winner.ambulanceId);

            if (winner.predictedState !== 'NORMAL') {
                finalCommands.push({
                    intersection_id: nodeId,
                    state: winner.predictedState,
                    controllerId: winner.ambulanceId,
                    eta: winner.eta
                });
            } else {
                multiCoordinator.removeController(nodeId);
            }
        });

        // For Simulation purposes, we log the conflict resolution if multiple ambulances hit
        if (registry.length > 1 && finalCommands.length > 0) {
           logService.addLog(`DECISION ENGINE: Resolved network map. Output: ${JSON.stringify(finalCommands.map(c => `${c.intersection_id}->${c.controllerId}`))}`, 'warning');
        }

        return finalCommands;
    }

    _calculateExecutionState(etaSeconds) {
        if (etaSeconds < 5) return 'GREEN';
        if (etaSeconds < 15) return 'PREPARE';
        if (etaSeconds < 30) return 'READY';
        return 'NORMAL';
    }
}

module.exports = new CentralDecisionEngine();
