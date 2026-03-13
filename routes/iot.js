const express = require('express');
const router = express.Router();
const trafficController = require('../services/TrafficController');
const logService = require('../services/LogService');

// Authentication middleware would go here in a real app to protect Admin endpoints

router.post('/ambulance-detected', (req, res) => {
    const { direction, active } = req.body;
    
    if (active) {
        trafficController.activateEmergencyMode(direction || 'north');
        res.json({ message: 'Emergency mode activated' });
    } else {
        trafficController.deactivateEmergencyMode();
        res.json({ message: 'Emergency mode deactivated' });
    }
});

router.post('/traffic-density', (req, res) => {
    const { direction, level } = req.body;
    
    if (!direction || !level) {
        return res.status(400).json({ message: 'Direction and level are required' });
    }
    
    const updated = trafficController.updateDensity(direction, level);
    if (updated) {
        res.json({ message: `Density updated for ${direction}` });
    } else {
        res.status(400).json({ message: 'Invalid density level' });
    }
});

router.get('/signal-status', (req, res) => {
    res.json(trafficController.getState());
});

router.post('/hazard-alert', (req, res) => {
    const { type, location } = req.body;
    logService.addLog(`Danger/Hazard reported: ${type} near ${location}`, 'warning');
    
    // In a real app we'd broadcast this to drivers specifically
    res.json({ message: 'Hazard broadcasted' });
});

module.exports = router;
