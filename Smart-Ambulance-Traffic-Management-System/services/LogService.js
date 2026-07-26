const fs = require('fs');
const path = require('path');

const cloudSyncService = require('./CloudSyncService');

class LogService {
    constructor() {
        this.logsFilePath = path.join(__dirname, '../data/logs.json');
        this.io = null;
        this.logs = [];
        this.loadLogs();
    }

    init(io) {
        this.io = io;
    }

    loadLogs() {
        try {
            if (fs.existsSync(this.logsFilePath)) {
                const data = fs.readFileSync(this.logsFilePath, 'utf8');
                this.logs = JSON.parse(data);
            } else {
                this.logs = [];
                this.saveLogs();
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.logs = [];
        }
    }

    saveLogs() {
        try {
            fs.writeFileSync(this.logsFilePath, JSON.stringify(this.logs, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving logs:', error);
        }
    }

    addLog(message, type = 'info') {
        const log = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            message,
            type
        };
        
        this.logs.unshift(log); // Add to beginning
        
        // Keep only last 100 logs locally
        if (this.logs.length > 100) {
            this.logs.pop();
        }

        this.saveLogs();
        
        // Asynchronous Cloud Sync (Does not block the signal logic)
        cloudSyncService.syncLog(log);

        // Broadcast to all clients (Real-time dashboard)
        if (this.io) {
            this.io.emit('new-log', log);
        }
    }

    getLogs() {
        return this.logs;
    }
}

module.exports = new LogService();
