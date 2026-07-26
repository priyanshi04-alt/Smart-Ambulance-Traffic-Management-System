const http = require('http');

/**
 * Advanced Acoustic Sensor Calibration Test
 * Simulates a rising frequency sweep (Siren Wail) 
 * and sends it to the server for detection analysis.
 */

async function simulateSiren() {
    console.log('🚀 Starting Acoustic Siren Simulation...');
    
    // Simulating a sweep from 400Hz to 1200Hz
    const frames = [];
    for (let i = 0; i < 15; i++) {
        frames.push({
            dominantFrequency: 400 + (i * 60), // Sweeping up
            amplitude: 45 // Well above noise floor
        });
    }

    for (const frame of frames) {
        await sendFrame(frame);
        // Small delay between frames
        await new Promise(r => setTimeout(r, 100));
    }
}

function sendFrame(data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/iot/siren-audio-data',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const parsed = JSON.parse(body);
                console.log(`📡 [Freq: ${data.dominantFrequency}Hz] Status: ${parsed.status} | Confidence: ${parsed.confidence}%`);
                resolve();
            });
        });

        req.on('error', e => reject(e));
        req.write(payload);
        req.end();
    });
}

simulateSiren().then(() => {
    console.log('\n✅ Simulation Complete. Check the Dashboard Logs for "Siren Pattern Confirmed!"');
}).catch(console.error);
