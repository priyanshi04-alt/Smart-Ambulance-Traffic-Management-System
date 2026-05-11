const logService = require('./LogService');

/**
 * Intelligent Acoustic Siren Detection System
 * Handles DSP validation (simulation of ESP32 FFT data), 
 * False Positive Reduction, and Confidence Scoring.
 */
class SirenDetectionService {
    constructor() {
        this.frequencyHistory = [];
        this.HISTORY_LIMIT = 15;
        this.TARGET_FREQ_MIN = 500; // Expanded for real-world sweeps
        this.TARGET_FREQ_MAX = 1500; // Expanded for real-world sweeps
        this.REQUIRED_DELTA_SUM = 200; // Min total frequency movement to confirm a sweep
        
        // Machine Learning Scaffold
        this.mlDataset = []; 
    }

    /**
     * Analyzes incoming audio telemetry from ESP32.
     * @param {Object} data - Contains frequency peaks and db levels
     * @returns {Object} { isValid: boolean, confidence: number }
     */
    processAudioFrames(data) {
        const { dominantFrequency, amplitude } = data;
        
        // 1. Noise Rejection
        if (amplitude < 40) {
            this._addHistory(0);
            return { isValid: false, confidence: 0 };
        }

        // 2. Frequency Window Check
        const inWindow = dominantFrequency >= this.TARGET_FREQ_MIN && dominantFrequency <= this.TARGET_FREQ_MAX;
        this._addHistory(inWindow ? dominantFrequency : 0);

        // 3. Pattern Recognition: Is it sweeping?
        const isSweeping = this._detectSweep();
        const confidence = this._calculateConfidence(inWindow, isSweeping);
        
        if (confidence > 80) {
            this._logMLSignature(dominantFrequency, amplitude);
        }

        const isValid = confidence >= 75; // Slightly lower threshold for pattern match
        
        if (isValid) {
            logService.addLog(`Siren Pattern Confirmed! Confidence: ${confidence}% Sweep: ${isSweeping ? 'YES' : 'NO'}`, 'warning');
        }

        return { isValid, confidence };
    }

    _addHistory(freq) {
        this.frequencyHistory.push(freq);
        if (this.frequencyHistory.length > this.HISTORY_LIMIT) {
            this.frequencyHistory.shift();
        }
    }

    /**
     * Detects if the frequency is rising or falling (Sweeping).
     * This distinguishes sirens from constant tones like horns.
     */
    _detectSweep() {
        if (this.frequencyHistory.length < 5) return false;
        
        let totalDelta = 0;
        for (let i = 1; i < this.frequencyHistory.length; i++) {
            if (this.frequencyHistory[i] > 0 && this.frequencyHistory[i-1] > 0) {
                totalDelta += Math.abs(this.frequencyHistory[i] - this.frequencyHistory[i-1]);
            }
        }
        
        // If the frequency is jumping around enough, it's likely a modulated siren
        return totalDelta > this.REQUIRED_DELTA_SUM;
    }

    _calculateConfidence(inWindow, isSweeping) {
        if (this.frequencyHistory.length < 5) return 0;
        
        const validFrames = this.frequencyHistory.filter(f => f >= this.TARGET_FREQ_MIN).length;
        const consistencyScore = (validFrames / this.HISTORY_LIMIT) * 60; // 60% weight on frequency
        const patternScore = isSweeping ? 40 : 0; // 40% weight on pattern (sweep)

        return Math.min(100, Math.round(consistencyScore + patternScore));
    }
    
    _logMLSignature(freq, amp) {
        this.mlDataset.push({ freq, amp, timestamp: Date.now(), label: 'siren' });
        if(this.mlDataset.length > 500) this.mlDataset.shift();
    }
    
    getStats() {
        return {
            datasetSize: this.mlDataset.length,
            currentConfidence: this._calculateConfidence()
        };
    }
}

module.exports = new SirenDetectionService();
