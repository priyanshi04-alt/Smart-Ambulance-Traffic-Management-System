const fs = require('fs');
const path = require('path');

/**
 * Logging & Analytics Module
 * Logs every systemic action to generate mathematical metrics.
 */
class AnalyticsModule {
    constructor() {
        this.masterLog = [];
        // Optional: Save to file for persistence
        this.logFilePath = path.join(__dirname, '../data/analytics_logs.json');
        
        // Ensure data dir exists
        const dir = path.join(__dirname, '../data');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        
        // Load existing logs if any
        try {
            if (fs.existsSync(this.logFilePath)) {
                this.masterLog = JSON.parse(fs.readFileSync(this.logFilePath, 'utf8'));
            }
        } catch(e) { /* ignore */ }
    }

    /**
     * @param {Object} data { ambulance_id, junction_id, eta, signal_state, response_time, ack_status, severity }
     */
    recordAction(data) {
        const entry = {
            ...data,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        
        this.masterLog.push(entry);
        
        // Prune to keep lightweight
        if (this.masterLog.length > 10000) this.masterLog.shift();
        
        // Background file sync
        this._persistLogs();
    }

    /**
     * Generates on-demand metrics
     */
    generateMetrics() {
        if (this.masterLog.length === 0) return { status: 'NO_DATA' };

        let totalResponseTime = 0;
        let responseCount = 0;
        let successfulAcks = 0;
        let totalSignalChanges = this.masterLog.length;

        // Metrics logic
        this.masterLog.forEach(log => {
            if (log.response_time) {
                totalResponseTime += log.response_time;
                responseCount++;
            }
            if (log.ack_status === 'RECEIVED') {
                successfulAcks++;
            }
        });

        const avgResponseMs = responseCount > 0 ? (totalResponseTime / responseCount).toFixed(2) : 0;
        
        // Algorithm: Estimated delay reduction assumes ~45 seconds saved per preemptive corridor
        const estDelayReductionMins = ((totalSignalChanges * 45) / 60).toFixed(1);
        
        const signalEfficiency = totalSignalChanges > 0 
            ? ((successfulAcks / totalSignalChanges) * 100).toFixed(1) 
            : 100;

        return {
            totalActionsTracked: totalSignalChanges,
            averageNodeResponseLatencyMs: avgResponseMs,
            estimatedDelayReductionMins: estDelayReductionMins,
            hardwareSignalEfficiencyPercent: signalEfficiency
        };
    }

    _persistLogs() {
        fs.writeFile(this.logFilePath, JSON.stringify(this.masterLog, null, 2), (err) => {
            if (err) console.error("Failed to write analytics persistence");
        });
    }
}

module.exports = new AnalyticsModule();
