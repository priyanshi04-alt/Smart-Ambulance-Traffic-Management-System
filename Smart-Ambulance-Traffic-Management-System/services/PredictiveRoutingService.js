const logService = require('./LogService');

/**
 * Predictive ETA Engine (Computation Layer Only)
 * Calculates ETAs to mapped nodes but DOES NOT execute signal changes.
 */
class PredictiveRoutingService {
    constructor() {
        this.nodes = [
            { id: 'JUNC-01', lat: 28.6139, lng: 77.2090, address: 'Main Junction (I1)', congestion: 1.0 }, // Physical Node
            { id: 'JUNC-02', lat: 28.6110, lng: 77.2090, address: 'South Node (I3)', congestion: 1.0 },    // Simulated Node
            { id: 'JUNC-03', lat: 28.6160, lng: 77.2090, address: 'North Node (I2)', congestion: 1.0 }     // Simulated Node
        ];
    }

    /**
     * @returns {Array} priorities - Junction priority list with Congestion-Weighted ETAs
     */
    evaluateTrajectory(data) {
        const { lat, lng, speed } = data;
        let actions = [];

        if (!speed || speed < 1) return actions; 

        const speedMs = parseFloat(speed);

        this.nodes.forEach(node => {
            const distanceMeters = this._calculateDistance(lat, lng, node.lat, node.lng);
            
            // Congestion-Weighted ETA (The core innovation)
            // Real ETA = distance / speed
            // Adjusted ETA = (distance / speed) * congestionFactor
            const baseEta = distanceMeters / speedMs;
            const adjustedEta = baseEta * node.congestion;

            actions.push({
                nodeId: node.id,
                address: node.address,
                distance: distanceMeters,
                baseEta: baseEta,
                eta: adjustedEta, // Use adjusted ETA for signal planning
                congestion: node.congestion
            });
        });
        
        // Sort by ADJUSTED ETA (Priority to the fastest route, not just shortest)
        actions.sort((a, b) => a.eta - b.eta);
        
        if (actions.length > 0) {
            const best = actions[0];
            if (best.congestion > 1.5) {
                logService.addLog(`High Congestion Detected at ${best.address}. Recalculating Optimal Corridor...`, 'warning');
            }
        }

        return actions.slice(0, 3);
    }

    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const p1 = lat1 * Math.PI/180;
        const p2 = lat2 * Math.PI/180;
        const dp = (lat2-lat1) * Math.PI/180;
        const dl = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; 
    }
}

module.exports = new PredictiveRoutingService();
