const logService = require('./LogService');

/**
 * Predictive ETA Engine (Computation Layer Only)
 * Calculates ETAs to mapped nodes but DOES NOT execute signal changes.
 */
class PredictiveRoutingService {
    constructor() {
        this.nodes = [
            { id: 'JUNC-01', lat: 28.62, lng: 77.215, address: 'Main St & 1st Ave', congestion: 1.0 }, // Clear
            { id: 'JUNC-02', lat: 28.625, lng: 77.220, address: 'Main St & 2nd Ave', congestion: 2.5 }, // Jams (High factor)
            { id: 'JUNC-03', lat: 28.63, lng: 77.225, address: 'Metro Boulevard', congestion: 1.2 }  // Moderate
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
