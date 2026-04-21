const express = require('express');
const router = express.Router();
const trafficController = require('../services/TrafficController');
const logService = require('../services/LogService');
const sirenDetection = require('../services/SirenDetectionService');
const hwSync = require('../services/HardwareSyncService');

// [NEW] Multi-Ambulance Coordination Simulation Trigger (Demo-Safe)
const multiCoordinator = require('../services/MultiAmbulanceCoordinator');
const decisionEngine = require('../services/CentralDecisionEngine');
const analytics = require('../services/AnalyticsModule');

// Authentication middleware would go here in a real app to protect Admin endpoints

router.post('/ambulance-detected', (req, res) => {
    const { direction, active } = req.body;
    
    if (active) {
        logService.addLog(`Hardware FFT Siren Trigger ACTIVATED. Handing off to AutoSiren executor.`, 'warning');
        trafficController.activateAutoSiren(direction || 'north');
        res.json({ message: 'AutoSiren active via intelligent hardware detection' });
    } else {
        logService.addLog(`Emergency override DEACTIVATED`, 'info');
        trafficController.deactivateEmergencyMode();
        res.json({ message: 'Emergency manual override deactivated' });
    }
});

router.post('/siren-audio-data', (req, res) => {
    const data = req.body; 
    if (!data.dominantFrequency || !data.amplitude) return res.status(400).json({ error: 'Missing frequency or amplitude data' });

    const result = sirenDetection.processAudioFrames(data);
    if (result.isValid) {
        trafficController.activateAutoSiren('south');
        res.json({ status: 'ACTION_TAKEN', confidence: result.confidence });
    } else {
        res.json({ status: 'IGNORED_NOISE', confidence: result.confidence });
    }
});

router.post('/node-ack', (req, res) => {
    const { commandId, status } = req.body;
    if (commandId) hwSync.handleAck(commandId, status || 'RECEIVED');
    res.json({ message: 'ACK Processed' });
});

router.post('/traffic-density', (req, res) => {
    const { direction, level } = req.body;
    if (!direction || !level) return res.status(400).json({ message: 'Direction and level are required' });
    const updated = trafficController.updateDensity(direction, level);
    if (updated) {
        logService.addLog(`Traffic density forcefully set to ${level.toUpperCase()} for ${direction}`, 'info');
        res.json({ message: `Density updated for ${direction}` });
    }
    else res.status(400).json({ message: 'Invalid density level' });
});

router.get('/signal-status', (req, res) => {
    res.json(trafficController.getState());
});

router.post('/hazard-alert', (req, res) => {
    const { type, location } = req.body;
    logService.addLog(`Danger/Hazard reported: ${type} near ${location}`, 'warning');
    res.json({ message: 'Hazard broadcasted' });
});

// Demo-Safe execution strategy endpoints
router.post('/simulate-multi-ambulance', (req, res) => {
    // Inject mock ambulances into the coordinator registry
    multiCoordinator.updateAmbulance('AMB-1', { lat: 28.621, lng: 77.215, speed: 65, heading: 180 }, 'CRITICAL');
    multiCoordinator.updateAmbulance('AMB-2', { lat: 28.625, lng: 77.210, speed: 45, heading: 90 }, 'NORMAL');
    
    // Fire the Central Decision Engine to resolve conflicts and output maps
    const resolution = decisionEngine.evaluateNetwork();
    
    res.json({
        mode: 'MULTI_AMBULANCE_SIMULATION',
        status: 'SUCCESS',
        activeRegistry: multiCoordinator.getRegistry().length,
        resolvedCommands: resolution,
        message: 'Simulation executed cleanly. Single Ambulance live demo remains unaffected.'
    });
});

// On-Demand Analytics Endpoint
router.get('/metrics', (req, res) => {
    res.json(analytics.generateMetrics());
});

module.exports = router;
