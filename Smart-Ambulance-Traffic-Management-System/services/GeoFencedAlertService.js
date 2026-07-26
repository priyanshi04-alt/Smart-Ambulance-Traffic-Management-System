const logService = require('./LogService');
const analytics = require('./AnalyticsModule');

/**
 * Enhanced Geo-Fenced Civilian Alert System
 * Detects civilian devices conceptually near the ambulance's route
 * using dynamic speed-based radii and road filtering.
 */
class GeoFencedAlertService {
    constructor() {
        this.io = null;
        
        // Cooldowns
        this.COOLDOWN_MS = 15000; 
        this.activeCivilians = new Map(); 
        this.alertCooldowns = new Map(); 
    }

    init(io) {
        this.io = io;
        
        // Mock civilians (Added roadId for filtering concept)
        this.activeCivilians.set('CIV-001', { lat: 28.6205, lng: 77.215, heading: 180, roadId: 'R-MAIN' }); 
        this.activeCivilians.set('CIV-002', { lat: 28.62, lng: 77.2155, heading: 90, roadId: 'R-SIDE' });   
        this.activeCivilians.set('CIV-003', { lat: 28.619, lng: 77.215, heading: 0, roadId: 'R-MAIN' });    
    }

    registerCivilianLocation(civilianId, lat, lng, heading, roadId = 'UNKNOWN') {
        this.activeCivilians.set(civilianId, { lat, lng, heading, roadId });
    }

    processCivilianProximity(ambulanceData) {
        if (!this.io || !ambulanceData.lat) return;

        const ambLat = parseFloat(ambulanceData.lat);
        const ambLng = parseFloat(ambulanceData.lng);
        const ambSpeed = parseFloat(ambulanceData.speed) || 0;
        const ambHeading = parseFloat(ambulanceData.heading) || 0;
        
        // Mocking road resolution - assuming ambulance is on R-MAIN for demonstration
        const ambRoadId = 'R-MAIN'; 

        // Dynamic Radius Logic
        const dynamicAheadRadius = ambSpeed > 60 ? 150 : 80;
        const dynamicNearbyRadius = ambSpeed > 60 ? 80 : 40;

        for (const [civId, civData] of this.activeCivilians.entries()) {
            
            // 1. Road-Based Filtering Constraint (Don't alert cars on parallel, unconnected highways)
            if (civData.roadId !== 'UNKNOWN' && civData.roadId !== ambRoadId && civData.roadId !== 'R-SIDE') {
                continue; // Completely ignore
            }

            const distance = this._calculateDistance(ambLat, ambLng, civData.lat, civData.lng);
            if (distance > dynamicAheadRadius) continue;

            const relativity = this._calculateRelativity(ambLat, ambLng, ambHeading, civData.lat, civData.lng);
            
            let priority = null;
            let message = '';

            // Priority Logic based on spatial relativity & dynamic radius
            if (relativity === 'AHEAD' && distance <= dynamicAheadRadius) {
                priority = 'HIGH';
                message = `CRITICAL: Ambulance approaching from behind at ${ambSpeed}km/h. Clear lane!`;
            } else if (relativity === 'NEARBY' && distance <= dynamicNearbyRadius) {
                // If on different road but nearby intersection, downgrade to medium
                priority = civData.roadId === 'R-SIDE' ? 'LOW' : 'MEDIUM';
                message = `WARNING: Emergency vehicle in immediate vicinity. Check intersections.`;
            } else if (relativity === 'BEHIND' && distance <= dynamicNearbyRadius) {
                priority = 'LOW';
                message = `Ambulance has passed. Resume normal driving securely.`;
            }

            if (priority && this._canSendAlert(civId)) {
                this._dispatchAlert(civId, priority, message);
                
                // Track deep analytics
                analytics.recordAction({
                    ambulance_id: ambulanceData.ambulanceId || 'AMB-01',
                    action_type: 'CIVILIAN_GEO_ALERT',
                    civilian_id: civId,
                    priority,
                    distance_m: distance.toFixed(1)
                });
            }
        }
    }

    _calculateRelativity(ambLat, ambLng, ambHeading, civLat, civLng) {
        const y = Math.sin(civLng - ambLng) * Math.cos(civLat);
        const x = Math.cos(ambLat) * Math.sin(civLat) - Math.sin(ambLat) * Math.cos(civLat) * Math.cos(civLng - ambLng);
        let bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

        const headingDiff = Math.abs(bearing - ambHeading);
        
        if (headingDiff <= 45 || headingDiff >= 315) return 'AHEAD';
        else if (headingDiff >= 135 && headingDiff <= 225) return 'BEHIND';
        else return 'NEARBY';
    }

    _canSendAlert(civilianId) {
        const lastAlert = this.alertCooldowns.get(civilianId);
        const now = Date.now();
        if (!lastAlert || (now - lastAlert) > this.COOLDOWN_MS) {
            this.alertCooldowns.set(civilianId, now);
            return true;
        }
        return false;
    }

    _dispatchAlert(civilianId, priority, message) {
        this.io.emit('civilian-geo-alert', { civilianId, priority, message, timestamp: Date.now() });
        logService.addLog(`Geo-Fenced Alert Sent [${priority}]: ${message}`, priority === 'HIGH' ? 'warning' : 'info');
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

module.exports = new GeoFencedAlertService();
