const predictiveRouting = require('./PredictiveRoutingService');
const logService = require('./LogService');

/**
 * Multi-Ambulance Coordination Layer (BACKEND SUPPORT)
 * Maintains active registry and handles dynamic junction assignments.
 * Runs conceptually alongside Single Ambulance tracking.
 */
class MultiAmbulanceCoordinator {
    constructor() {
        this.activeAmbulances = new Map(); // id -> { data, severity }
        this.junctionControllers = new Map(); // junctionId -> current controlling ambulanceId
    }

    /**
     * Register or update an ambulance in the active map
     * @param {string} id - Ambulance ID
     * @param {Object} telemetry - { lat, lng, speed, heading }
     * @param {string} severity - 'CRITICAL', 'HIGH', 'NORMAL'
     */
    updateAmbulance(id, telemetry, severity = 'NORMAL') {
        this.activeAmbulances.set(id, {
            ...telemetry,
            severity,
            lastUpdate: Date.now()
        });

        // Auto-cleanup stale ambulances (out of network for > 2 mins)
        this._cleanupRegistry();
    }

    getRegistry() {
        return Array.from(this.activeAmbulances.entries()).map(([id, data]) => ({ id, ...data }));
    }

    /**
     * Resolves which ambulance legally controls an intersection right now
     */
    assignController(junctionId, ambulanceId) {
        this.junctionControllers.set(junctionId, ambulanceId);
        logService.addLog(`MULTI-COORD: Node [${junctionId}] locked to controller [${ambulanceId}]`, 'info');
    }

    removeController(junctionId) {
        if (this.junctionControllers.has(junctionId)) {
            const current = this.junctionControllers.get(junctionId);
            this.junctionControllers.delete(junctionId);
            logService.addLog(`MULTI-COORD: Node [${junctionId}] unlocked from [${current}]`, 'info');
        }
    }

    getJunctionController(junctionId) {
        return this.junctionControllers.get(junctionId) || null;
    }

    _cleanupRegistry() {
        const threshold = Date.now() - 120000;
        for (const [id, data] of this.activeAmbulances.entries()) {
            if (data.lastUpdate < threshold) {
                this.activeAmbulances.delete(id);
                // Also remove their locks
                for (const [jId, controller] of this.junctionControllers.entries()) {
                    if (controller === id) this.removeController(jId);
                }
            }
        }
    }
}

module.exports = new MultiAmbulanceCoordinator();
