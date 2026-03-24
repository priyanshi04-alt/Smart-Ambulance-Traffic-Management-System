const logService = require('./LogService');

/**
 * Intelligent Acoustic Siren Detection System
 * Handles DSP validation (simulation of ESP32 FFT data), 
 * False Positive Reduction, and Confidence Scoring.
 */
class SirenDetectionService {
    constructor() {
        this.detectionHistory = [];
        this.HISTORY_LIMIT = 10;
        this.REQUIRED_CONSECUTIVE_HITS = 3; // Temporal validation
        this.TARGET_FREQ_MIN = 700; // Hz
        this.TARGET_FREQ_MAX = 960; // Hz
        
        // Machine Learning Scaffold
        this.mlDataset = []; 
    }

    /**
     * Analyzes incoming audio telemetry from ESP32.
     * @param {Object} data - Contains frequency peaks and db levels
     * @returns {Object} { isValid: boolean, confidence: number }
     */
    processAudioFrames(data) {
        const { dominantFrequency, amplitude, timestamp } = data;
        
        // 1. Noise Rejection: Discard low amplitude (environmental noise)
        if (amplitude < 50) {
            this._addHistory(false);
            return { isValid: false, confidence: 0 };
        }

        // 2. Band-pass filtering (700-960 Hz check)
        const isSirenFreq = dominantFrequency >= this.TARGET_FREQ_MIN && dominantFrequency <= this.TARGET_FREQ_MAX;
        
        // 3. Temporal Validation & Confidence Scoring
        this._addHistory(isSirenFreq);
        const confidence = this._calculateConfidence();
        
        // ML dataset logging for confirmed patterns
        if (confidence > 80) {
            this._logMLSignature(dominantFrequency, amplitude);
        }

        const isValid = confidence >= 80; // Require 80% confidence
        
        if (isValid) {
            logService.addLog(`Robust Siren Pattern Confirmed! Config: ${confidence}% freq: ~${dominantFrequency}Hz`, 'warning');
        }

        return { isValid, confidence };
    }

    _addHistory(isHit) {
        this.detectionHistory.push(isHit ? 1 : 0);
        if (this.detectionHistory.length > this.HISTORY_LIMIT) {
            this.detectionHistory.shift();
        }
    }

    _calculateConfidence() {
        if (this.detectionHistory.length === 0) return 0;
        
        // Check temporal consistency (must have consecutive hits recently)
        let consecutiveHits = 0;
        for (let i = this.detectionHistory.length - 1; i >= 0; i--) {
            if (this.detectionHistory[i] === 1) consecutiveHits++;
            else break;
        }
        
        if (consecutiveHits < this.REQUIRED_CONSECUTIVE_HITS) {
            return 0; // Fails temporal validation (e.g., brief horn beep)
        }

        // Overall consistency in the window
        const hits = this.detectionHistory.reduce((a, b) => a + b, 0);
        return Math.round((hits / this.HISTORY_LIMIT) * 100);
    }
    
    _logMLSignature(freq, amp) {
        this.mlDataset.push({ freq, amp, timestamp: Date.now(), label: 'siren' });
        // Keep dataset from blowing memory
        if(this.mlDataset.length > 1000) this.mlDataset.shift();
    }
    
    getStats() {
        return {
            datasetSize: this.mlDataset.length,
            currentConfidence: this._calculateConfidence()
        };
    }
}

module.exports = new SirenDetectionService();
