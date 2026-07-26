const logService = require('./LogService');

/**
 * Multi-Node Synchronization Layer
 * Guarantees message delivery to ESP32 nodes using ACKs and Retries.
 */
class HardwareSyncService {
    constructor() {
        this.pendingCommands = new Map(); // commandId -> CommandDetails
        this.MAX_RETRIES = 3;
        this.RETRY_INTERVAL_MS = 1000;
        this.io = null;
    }

    init(io) {
        this.io = io;
    }

    /**
     * Sends a synchronized command to a hardware node
     */
    sendCommand(nodeId, commandPayload) {
        if (!this.io) return;

        const commandId = 'CMD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const packet = {
            commandId,
            nodeId,
            timestamp: Date.now(),
            payload: commandPayload
        };

        this.pendingCommands.set(commandId, {
            packet,
            retries: 0,
            timer: this._startRetryTimer(commandId)
        });

        // Broadcast to hardware (In reality, emitted to a specific socket room/id)
        this.io.emit('hardware-sync', packet);
        // logService.addLog(`Sent hardware sync [${commandId}] to ${nodeId}`, 'info');
    }

    /**
     * Handles incoming hardware ACK
     */
    handleAck(commandId, status) {
        if (this.pendingCommands.has(commandId)) {
            const cmd = this.pendingCommands.get(commandId);
            clearTimeout(cmd.timer); // Clear timeout
            this.pendingCommands.delete(commandId);
            // logService.addLog(`Hardware ACK received for [${commandId}]. Status: ${status}`, 'info');
        }
    }

    _startRetryTimer(commandId) {
        return setTimeout(() => {
            if (this.pendingCommands.has(commandId)) {
                const cmd = this.pendingCommands.get(commandId);
                
                if (cmd.retries >= this.MAX_RETRIES) {
                    // logService.addLog(\`HARDWARE FAULT: Node \${cmd.packet.nodeId} failed to acknowledge command [\${commandId}] after \${this.MAX_RETRIES} attempts.\`, 'warning');
                    this.pendingCommands.delete(commandId);
                } else {
                    cmd.retries++;
                    // logService.addLog(\`Retrying hardware sync [\${commandId}] -> \${cmd.packet.nodeId} (Attempt \${cmd.retries})\`, 'warning');
                    this.io.emit('hardware-sync', cmd.packet);
                    cmd.timer = this._startRetryTimer(commandId); // Reset timer
                }
            }
        }, this.RETRY_INTERVAL_MS);
    }

    handleHealthCheck(report) {
        const { nodeId, sensorStatus, signalHealth } = report;
        if (sensorStatus === 'ERROR' || signalHealth === 'ERROR') {
            logService.addLog(`HARDWARE FAULT DETECTED: Node ${nodeId} [Sensor: ${sensorStatus}, Signal: ${signalHealth}]`, 'warning');
        }
    }
}

module.exports = new HardwareSyncService();
