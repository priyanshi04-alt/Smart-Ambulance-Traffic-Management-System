const http = require('http');

/**
 * 🚦 Acoustic Traffic Density Simulation Tool
 * Simulates ambient urban traffic noise amplitudes:
 * - "high" (amplitude: 90) -> Sets South Lane Density to HIGH
 * - "medium" (amplitude: 60) -> Sets South Lane Density to MEDIUM
 * - "low" (amplitude: 25) -> Sets South Lane Density to LOW
 */

const mode = process.argv[2] ? process.argv[2].toLowerCase() : 'high';

let amplitude = 25;
if (mode === 'high') amplitude = 90;
else if (mode === 'medium') amplitude = 60;

const payload = JSON.stringify({
    dominantFrequency: 250, // 250Hz is regular traffic hum, NOT an ambulance siren (sirens are 600-2100Hz)
    amplitude: amplitude
});

console.log(`\n🔊 Simulating [${mode.toUpperCase()}] Ambient Traffic Noise (Amplitude: ${amplitude})...`);
console.log(`📡 Sending data to Dual-Purpose Acoustic Server Endpoint (/api/iot/siren-audio-data)...`);

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
        console.log(`\n=============================================================`);
        console.log(`✅ RESPONSE: ${parsed.status}`);
        console.log(`📊 South Lane Traffic Density set to: ${parsed.ambientDensitySet.toUpperCase()}`);
        console.log(`=============================================================`);
        console.log(`👉 Ab Admin/Driver dashboard par dekhiye:`);
        console.log(`   South Node ki Traffic Density ${parsed.ambientDensitySet.toUpperCase()} ho chuki hai!`);
    });
});

req.on('error', e => {
    console.error(`❌ Error connecting to server: ${e.message}`);
    console.log(`   Make sure your server is running (npm start)!`);
});

req.write(payload);
req.end();
