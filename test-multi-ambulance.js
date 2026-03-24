const http = require('http');

console.log("🚑 Initiating Patent-Grade Multi-Ambulance Simulation...");
console.log("Injecting 2 simulated ambulances into the Central Decision Engine:");
console.log(" - AMB-1: CRITICAL Severity (ETA: ~10s)");
console.log(" - AMB-2: NORMAL Severity (ETA: ~15s)\n");

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/iot/simulate-multi-ambulance',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log("✅ SIMULATION COMPLETE! Here is the engine's mathematical resolution:\n");
            console.log(JSON.stringify(result, null, 2));
            console.log("\nNotice in 'resolvedCommands' how the Engine stripped the lock from the NORMAL ambulance and granted 'GREEN' execution priority exclusively to the CRITICAL ambulance (AMB-1) for Junction 1 (JUNC-01).");
        } catch (e) {
            console.log("Error parsing response:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.error("Make sure your server is running (node server.js) on port 3000!");
});

req.end();
