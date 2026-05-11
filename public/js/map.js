// Global Map Variables
let map;
let trafficMarkers = [];
let routeLines = [];
let ambulanceMarker;
let routePolyline;

// GPS Tracking State
window.useDeviceGPS = false;
let gpsWatchId = null;
let lastGpsCoords = null;
let isTripActive = false;
let simulationInterval;
let hospitalMarkers = {};

// Hardcoded intersections serving as the smart nodes
const intersections = [
    { id: 'I1', lat: 28.6139, lng: 77.2090, name: 'Main Junction' }, // Simulation center (Delhi coords)
    { id: 'I2', lat: 28.6160, lng: 77.2090, name: 'North Node' },
    { id: 'I3', lat: 28.6110, lng: 77.2090, name: 'South Node' },
    { id: 'I4', lat: 28.6139, lng: 77.2130, name: 'East Node' },
    { id: 'I5', lat: 28.6139, lng: 77.2050, name: 'West Node' }
];

const hospitals = {
    'city': { lat: 28.6200, lng: 77.2150, name: 'City General Hospital' },
    'metro': { lat: 28.6050, lng: 77.2000, name: 'Metro Heart Institute' },
    'apollo': { lat: 28.6150, lng: 77.2250, name: 'Apollo Life Care' }
};
window.hospitalData = hospitals;

window.initMap = function(containerId, role) {
    if (map) {
        map.remove(); 
    }
    
    // Default center at I1 (Delhi)
    let initialCenter = [28.6139, 77.2090];
    let initialZoom = 15;

    map = L.map(containerId, {
        zoomControl: false,
        attributionControl: false
    }).setView(initialCenter, initialZoom);
    
    if (role === 'hospital') window.hMap = map;
    if (role === 'admin') window.adminMap = map;
    if (role === 'driver') window.driverMap = map;
    
    // Add custom styled tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Add zoom controls bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    // Listen for driver clicks to set destination dynamically
    if (role === 'driver') {

        // Click fallback if they want to drop a pin manually
        map.on('click', function(e) {
            if (isTripActive) return; // Can't change route mid-trip right now
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Let the system know the driver selected a custom point
            window.customDestination = { lat, lng };
            
            // Automatically draw the route proposal
            window.calculateAndDrawRoute(lat, lng).then(waypoints => {
                 window.proposedWaypoints = waypoints;
                 if(window.speak) window.speak("New manual destination selected. Route calculated.");
                 if(window.addAlertBox) window.addAlertBox("Manual Destination Pin Dropped", "success");
            });
        });
    }

    // Render nodes
    intersections.forEach(node => {
        const iconHtml = `<div class="bg-slate-800 border-2 border-white w-4 h-4 rounded-full shadow-lg flex items-center justify-center">
                            <div class="w-2 h-2 rounded-full ${node.id === 'I1' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}"></div>
                          </div>`;
                          
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [16,16], iconAnchor: [8,8] });
        L.marker([node.lat, node.lng], { icon }).addTo(map).bindPopup(`<b>${node.name}</b><br>Smart Signal Node`);
    });
    
    // Render Hospitals
    Object.values(hospitals).forEach(h => {
         const hIcon = L.divIcon({ 
             html: `<div class="bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cross"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
                    </div>`, 
             className: '', 
             iconSize: [32,32], 
             iconAnchor: [16,16] 
         });
         L.marker([h.lat, h.lng], { icon: hIcon }).addTo(map).bindPopup(`<b>${h.name}</b>`);
    });

    if (role === 'driver') {
        // Init Ambulance Marker at a random start point
        const startPoint = [28.6000, 77.2050];
        
        const ambIconHtml = `
            <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-slate-200">
               <div class="w-6 h-6 bg-red-500 rounded-sm absolute flex items-center justify-center animate-pulse">
               </div>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ambulance z-10"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h2"/><path d="M19 18h2a2 2 0 0 0 2-2v-3.26a1 1 0 0 0-.2-.6l-3-4.5a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="6" cy="18" r="2"/></svg>
            </div>
        `;
        
        ambulanceMarker = L.marker(startPoint, {
            icon: L.divIcon({ html: ambIconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] })
        }).addTo(map);
        
        map.setView(startPoint, 15);
    }
    
    return map;
};

window.initAdminSecondaryMap = function(containerId) {
    let initialCenter = [28.6139, 77.2090];
    let initialZoom = 13; // slightly zoomed out for global view
    
    let secMap = L.map(containerId, {
        zoomControl: false,
        attributionControl: false
    }).setView(initialCenter, initialZoom);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
    }).addTo(secMap);
    
    intersections.forEach(node => {
        const iconHtml = `<div class="bg-slate-800 border-2 border-white w-3 h-3 rounded-full shadow-lg"></div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [12,12], iconAnchor: [6,6] });
        L.marker([node.lat, node.lng], { icon }).addTo(secMap);
    });

    Object.values(hospitals).forEach(h => {
         const hIcon = L.divIcon({ 
             html: `<div class="bg-red-500 text-white w-6 h-6 rounded-full shadow-lg flex items-center justify-center border border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cross"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
                    </div>`, 
             className: '', 
             iconSize: [24,24], 
             iconAnchor: [12,12] 
         });
         L.marker([h.lat, h.lng], { icon: hIcon }).addTo(secMap);
    });
    
    window.adminGlobalMapInstance = secMap;
    return secMap;
};

window.calculateAndDrawRoute = async function(destinationLat, destinationLng) {
    if (!map || !ambulanceMarker) return null;
    
    // Clear old route
    if (routePolyline) map.removeLayer(routePolyline);
    
    const start = { lat: 28.6000, lng: 77.2050 };
    let coords = [];
    
    // Deterministic Routing for Demo Stability
    // We strictly define the routes here so they always hit the intersections perfectly
    const destId = window.currentDestId;
    
    if (destId === 'city') {
         // Scenario 1: City Hospital (Passes directly through South Node I3 -> Main Junction I1 -> turns right to hospital)
         coords = [
              { lat: 28.6000, lng: 77.2050, instruction: 'Head north on local road' },
              { lat: 28.6050, lng: 77.2050, instruction: 'Turn right onto cross street' },
              { lat: 28.6050, lng: 77.2090, instruction: 'Turn left onto Main Avenue' },
              { lat: 28.6110, lng: 77.2090, instruction: 'Pass through South Node' }, // I3
              { lat: 28.6139, lng: 77.2090, instruction: 'Approaching Main Junction' }, // I1
              { lat: 28.6160, lng: 77.2090, instruction: 'Pass through North Node' }, // I2
              { lat: 28.6200, lng: 77.2090, instruction: 'Turn right onto Hospital Road' },
              { lat: 28.6200, lng: 77.2150, instruction: 'Arrive at City General' }
         ];
    } else if (destId === 'metro') {
         // Scenario 2: Metro Heart Institute
         coords = [
              { lat: 28.6000, lng: 77.2050, instruction: 'Head east' },
              { lat: 28.6000, lng: 77.2090, instruction: 'Turn left onto Main Avenue' },
              { lat: 28.6025, lng: 77.2090, instruction: 'Merge onto left lane' },
              { lat: 28.6050, lng: 77.2090, instruction: 'Turn left onto Clinic Road' },
              { lat: 28.6050, lng: 77.2000, instruction: 'Arrive at Metro Heart' }
         ];
    } else if (destId === 'apollo') {
         // Scenario 3: Apollo Life Care (Passes East/West nodes)
         coords = [
              { lat: 28.6000, lng: 77.2050, instruction: 'Head north' },
              { lat: 28.6139, lng: 77.2050, instruction: 'Pass through West Node' }, // I5
              { lat: 28.6139, lng: 77.2090, instruction: 'Pass through Main Junction' }, // I1
              { lat: 28.6139, lng: 77.2130, instruction: 'Pass through East Node' }, // I4
              { lat: 28.6139, lng: 77.2250, instruction: 'Turn North towards Apollo' },
              { lat: 28.6150, lng: 77.2250, instruction: 'Arrive at Apollo Life' }
         ];
    } else {
         // Fallback manual point
         const dest = { lat: destinationLat, lng: destinationLng };
         coords = [
              { lat: start.lat, lng: start.lng, instruction: 'Head towards destination' },
              { lat: 28.6110, lng: 77.2090, instruction: 'Navigating intersections' },
              { lat: dest.lat, lng: 77.2090, instruction: 'Nearing arrival' },
              { lat: dest.lat, lng: dest.lng, instruction: 'Arrive at destination' }
         ];
    }
    
    // Convert to Leaflet structure
    const lineCoords = coords.map(c => [c.lat, c.lng]);
    
    routePolyline = L.polyline(lineCoords, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round',
        className: 'animate-pulse'
    }).addTo(map);
    
    map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
    
    L.marker([destinationLat, destinationLng], {
         icon: L.divIcon({
              html: '<div class="bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-white"><i data-lucide="map-pin" class="w-5 h-5"></i></div>',
              className: 'bg-transparent'
         })
    }).addTo(map);
    
    lucide.createIcons();
    return coords;
};

window.startDriverSimulation = function(waypoints) {
    if (isTripActive || !ambulanceMarker || !waypoints || waypoints.length < 2) return;
    isTripActive = true;
    
    let currentLeg = 0;
    let progress = 0; // 0 to 1
    const baseSpeed = 25; // Faster minimum MS per step
    let dynamicSpeed = baseSpeed;
    
    // Demo variables
    window.isStuckAtRed = false;
    window.demoPause = false; // New explicitly choreographed pause
    window.scenarioCars = [];
    window.predictiveCorridorLine = null;
    
    // Explicit Scenario Introductions for Demo Clarity
    if (window.currentDestId === 'city') {
         speak("Initiating Scenario 1. Destination: City General. Objective: Demonstrating Smart Intersection Override during heavy traffic.");
         addAlertBox("Scenario 1: Heavy Traffic Override", "info");
    } else if (window.currentDestId === 'metro') {
         speak("Initiating Scenario 2. Destination: Metro Heart. Objective: Demonstrating Emergency Lane Clearance of civilian vehicles.");
         addAlertBox("Scenario 2: Emergency Lane Clearance", "info");
    } else if (window.currentDestId === 'apollo') {
         speak("Initiating Scenario 3. Destination: Apollo Life Care. Objective: Demonstrating Predictive multi-node city wide green corridor.");
         addAlertBox("Scenario 3: Predictive Routing", "info");
    } else {
         speak(`Starting route to ${window.currentDestName || 'destination'}. Drive safely.`);
    }
    
    
    const runSimulationStep = () => {
        if (!isTripActive) {
            return;
        }
        
        if (window.demoPause) {
             // Explicitly waiting for a scripted audio event to finish
             if (isTripActive) {
                 simulationInterval = setTimeout(runSimulationStep, dynamicSpeed);
             }
             return;
        }
        
        // Wait if we are demonstrating being stuck in traffic
        if (window.isStuckAtRed) {
             // We are stuck! Wait until the global state turns green OR mode is active
             const globalState = window.currentTrafficState;
             const isGreenLight = globalState && globalState.signals && (globalState.signals.south === 'green' || globalState.signals.north === 'green');
             
             if (isGreenLight || window.isEmergencyActive) {
                 window.isStuckAtRed = false;
                 console.log("Co-Pilot: Green Corridor secured. Traffic cleared. Resuming journey.");
                 speak("Green Corridor secured. Traffic cleared. Resuming journey at high speed.");
                 addAlertBox("Green Corridor Activated", "success");
                 dynamicSpeed = 20; // Slight boost after getting unstuck
                 
                 // Clear dummy cars in Scenario 1
                 if (window.scenarioCars) {
                     window.scenarioCars.forEach(car => map.removeLayer(car));
                     window.scenarioCars = [];
                     if (window.currentDestId === 'city') speak("Traffic shifting. Lane cleared.");
                 }
                 
                 // Clear predictive line in Scenario 3 if it existed
                 if (window.predictiveCorridorLine) {
                     map.removeLayer(window.predictiveCorridorLine);
                     window.predictiveCorridorLine = null;
                 }
             }
             if (isTripActive) {
                 simulationInterval = setTimeout(runSimulationStep, dynamicSpeed);
             }
             return; // Skip advancing the ambulance
        }
        
        // Distance step scaling roughly based on coordinate distance to keep speed somewhat constant
        const p1 = waypoints[currentLeg];
        const p2 = waypoints[currentLeg + 1];
        if (!p1 || !p2) return;
        
        // Calculate hypotenuse distance to dynamic scale steps
        const dist = Math.sqrt(Math.pow(p2.lat-p1.lat, 2) + Math.pow(p2.lng-p1.lng, 2));
        const dynamicSteps = Math.max(10, Math.floor(dist * 60000)); // magic multiplier for zoom scale, lowered to increase speed
        
        // Progress strictly moves cleanly from 0 to 1 based on steps
        progress += (1 / dynamicSteps);
        
        // --- TURN BY TURN GUIDANCE ---
        // Look slightly ahead on progress (e.g. 50% through the leg) to announce the turn
        if (progress > 0.5 && p2.instruction && !p2.announced) {
             p2.announced = true;
             
             // Filter out noisy, minor instructions so they don't break the major Demo scripts
             const text = p2.instruction.toLowerCase();
             const isMinor = text.includes('continue') || text.includes('slight') || text.includes('depart');
             
             if (!isMinor) {
                 speak(`In 50 meters, ${p2.instruction}`);
                 addAlertBox(`Instruction: ${p2.instruction}`, "info");
             }
        }
        
        if (progress >= 1) {
            progress = 0;
            currentLeg++;
            
            if (currentLeg >= waypoints.length - 1) {
                // Reached!
                isTripActive = false;
                speak("Destination reached.");
                addAlertBox("Destination Reached", "success");
                
                // Reset UI
                if (typeof window.resetDriverUI === 'function') {
                    window.resetDriverUI();
                }
                
                // Clear demo visual assets
                if (window.predictiveCorridorLine) {
                     map.removeLayer(window.predictiveCorridorLine);
                     window.predictiveCorridorLine = null;
                }
                
                return;
            }
        }
        
        // Interpolate position
        // We already assigned p1 and p2 at the top for distance calculate
        const lat = p1.lat + (p2.lat - p1.lat) * progress;
        const lng = p1.lng + (p2.lng - p1.lng) * progress;
        
        ambulanceMarker.setLatLng([lat, lng]);

        // Track distance for Analytics (NEW)
        if (window.tripStats && isTripActive && !window.demoPause && !window.isStuckAtRed) {
            // Approx increment based on progress step
            window.tripStats.distance += (dist / dynamicSteps) * 111; // 111km per degree approx
        }
        
        // Auto-Trigger Logic (Simulated Siren Detection)
        // Main Intersection coordinate
        const targetLat = 28.6139;
        const targetLng = 77.2090;
        
        // Rough distance calculation (Pythagorean on lat/lng for tiny local distances)
        const distToIntersection = Math.sqrt(Math.pow(lat - targetLat, 2) + Math.pow(lng - targetLng, 2));
        
        // --- SCENARIO 3: PREDICTIVE MULTIPLE INTERSECTIONS (APOLLO) ---
        if (window.currentDestId === 'apollo' && currentLeg === 0 && progress > 0.8 && !window.predictiveTriggered) {
             window.predictiveTriggered = true;
             console.log("Scenario 3 Initiated");
             
             window.demoPause = true; // Stop the ambulance to sync the audio
             if(window.speechSynthesis) window.speechSynthesis.cancel(); // Clear old TTS queue
             
             speak("Calculating route. Requesting green corridor.");
             addAlertBox("AI Copilot: Pre-clearing 3 upcoming intersections (West, Main, East)...", "info");
             
             setTimeout(() => {
                  speak("Corridor secured. Nodes locked to green.");
                  addAlertBox("Predictive Green Corridor Active. High speed authorized.", "success");
                  const eBtn = document.getElementById('driverEmergencyBtn');
                  if (eBtn && !window.isEmergencyActive) eBtn.click();
                  
                  // Visual Enhancement: Draw a thick translucent green path over the remaining route
                  const remainingWaypoints = waypoints.slice(currentLeg);
                  window.predictiveCorridorLine = L.polyline(remainingWaypoints, {
                      color: '#22c55e',
                      weight: 12,
                      opacity: 0.6,
                      lineCap: 'round',
                      className: 'animate-pulse'
                  }).addTo(map);
                  
                  // Wait another short bit for the second voice line and then unpause!
                  setTimeout(() => {
                      window.demoPause = false;
                      dynamicSpeed = 40; // Ensure S3 ambulance takes a bit more time to let audio absolutely finish
                  }, 2000);
                  
             }, 3000); // Reduced delay for shorter audio
        }
        
        // --- SCENARIO 2: AVOID CONGESTION VIA DYNAMIC RE-ROUTING (METRO) ---
        if (window.currentDestId === 'metro' && progress > 0.3 && currentLeg === 1 && !window.tailgateTriggered) {
             window.tailgateTriggered = true;
             
             window.demoPause = true; // Stop ambulance to sync story
             if(window.speechSynthesis) window.speechSynthesis.cancel(); // Clear old TTS queue
             
             // AI Detecs huge congestion ahead
             speak("Severe congestion detected. Analyzing alternate routes.");
             addAlertBox("Congestion Detected ahead. Recalculating...", "warning");
             
             setTimeout(() => {
                 speak("Shorter, faster alternate route found via side streets. Re-routing now.");
                 addAlertBox("Alternate Route Generated to bypass traffic.", "success");
                 
                 // DELAY MAP RE-DRAW TO LET AUDIO SPEAK FIRST!
                 setTimeout(() => {
                     // Clear old visual route
                     if (routePolyline) map.removeLayer(routePolyline);
                     
                     // Generate new detour coords
                     const currentLat = lat;
                     const currentLng = lng;
                     
                     const detourCoords = [
                         { lat: currentLat, lng: currentLng, instruction: 'Detour accepted' },
                         { lat: currentLat, lng: 77.2020, instruction: 'Turn left onto empty side street' },
                         { lat: 28.6050, lng: 77.2020, instruction: 'Head north on side street' },
                         { lat: 28.6050, lng: 77.2000, instruction: 'Arrive at Metro Heart' }
                     ];
                     
                     // Draw the new detour line
                     const lineCoords = detourCoords.map(c => [c.lat, c.lng]);
                     routePolyline = L.polyline(lineCoords, {
                         color: '#a855f7', // Purple detour line
                         weight: 6,
                         opacity: 0.9,
                         dashArray: '10, 10',
                         lineCap: 'round',
                         className: 'animate-pulse'
                     }).addTo(map);
                     
                     // Swap the underlying physics arrays
                     waypoints.splice(0, waypoints.length, ...detourCoords);
                     currentLeg = 0; // Reset simulation leg to the start of the detour array
                     progress = 0;
                     
                     setTimeout(() => {
                         window.demoPause = false; // Unpause the world
                         dynamicSpeed = 25; // Resume at normal speed
                     }, 1000);
                 }, 3000); // Wait 3 seconds for the TTS to say "Shorter faster alternate route found..." BEFORE drawing it out.
                 
             }, 5000); // Wait 5 seconds for the first long dialogue describing congestion
        }

        // --- SCENARIO 1: HEAVY TRAFFIC INTERSECTION (CITY) ---
        if (window.currentDestId === 'city' && currentLeg === 3 && progress > 0.1 && window.scenarioCars.length === 0 && !window.carsSpawnedCity) {
            window.carsSpawnedCity = true;
            console.log("Spawning dummy traffic for Demo 1");
            // Spawn dummy cars blocking the intersection
            const cIcon = L.divIcon({
                 html: '<div class="w-6 h-6 bg-amber-500 rounded border border-amber-800 opacity-80 animate-pulse"></div>',
                 className: ''
            });
            const dummyTarget = L.marker([targetLat - 0.002, targetLng], { icon: cIcon }).addTo(map);
            dummyTarget.bindPopup("<div class='font-bold text-amber-600 text-center py-1 max-w-[150px]'>🛑 Dummy Traffic Blockade</div>", { closeButton: false, autoClose: false, className: 'demo-popup' }).openPopup();
            window.scenarioCars.push(dummyTarget);
            window.scenarioCars.push(L.marker([targetLat - 0.004, targetLng - 0.001], { icon: cIcon }).addTo(map));
            window.scenarioCars.push(L.marker([targetLat - 0.003, targetLng + 0.001], { icon: cIcon }).addTo(map));
        }

         if (window.currentDestId === 'city' && currentLeg === 3 && progress > 0.6 && !window.isEmergencyActive && !window.hasAutoTriggered) {
              window.hasAutoTriggered = true;
              
              // INTELLIGENT SIGNAL CHECK
              const globalState = window.currentTrafficState;
              let isAlreadyGreen = false;
              
              if (globalState && globalState.signals) {
                  if (globalState.signals.south === 'green' || globalState.signals.north === 'green') {
                      isAlreadyGreen = true;
                  }
              }

              if (isAlreadyGreen) {
                  console.log("Co-Pilot: Signal is already green. Skipping emergency trigger.");
                  speak("Approaching intersection. Signal is currently green. Proceed safely without overriding.");
                  addAlertBox("AI Copilot: Network shows green light ahead. Override unnecessary.", "success");
              } else {
                  console.log("Stuck in Traffic Demo Sequence Initiated...");
                  
                  // HALT THE SIMULATION FIRST to exaggerate the problem for the audience
                  window.isStuckAtRed = true; // Use this to wait out the actual node unlocking
                  if(window.speechSynthesis) window.speechSynthesis.cancel(); // Clear old TTS queue
                  
                  speak("Critical Warning. Trapped at Red Light. Initializing Smart Node Override to manipulate traffic flow.");
                  addAlertBox("Trapped at Red Light. Overriding Global Server...", "warning");
                  
                  // Wait 6 seconds to let the LONG voice line finish and let audience absorb that it is stuck
                  setTimeout(() => {
                      // Trigger the manual button visually and functionally to request the rescue
                      const eBtn = document.getElementById('driverEmergencyBtn');
                      if (eBtn && !window.isEmergencyActive) eBtn.click();
                      // (The generic isStuckAtRed logic block will handle unpausing the ambulance when this button click resolves into the network changing the lights)
                  }, 6000);
              }
         }
        
        // Auto-disable logic (cleared intersection) for Scenario 1
        // Leg 4 means we have passed the main junction and are heading to the North Node
        if (window.currentDestId === 'city' && currentLeg >= 4 && progress > 0.2 && window.isEmergencyActive && !window.clearanceAnnounced) {
             window.clearanceAnnounced = true;
             
             // PAUSE SIMULATION ONE LAST TIME to guarantee the audio finishes before hitting the hospital
             window.demoPause = true;
             if(window.speechSynthesis) window.speechSynthesis.cancel();
             
             speak("Intersection cleared. Resuming normal traffic.");
             addAlertBox("Intersection cleared. Resuming normal traffic cycle.", "info");
             
             // Trigger btn to turn off
             const eBtn = document.getElementById('driverEmergencyBtn');
             if (eBtn && window.isEmergencyActive) eBtn.click();
             
             setTimeout(() => {
                 window.demoPause = false;
                 dynamicSpeed = 30; // Normal final crawl into the hospital
             }, 2500); // Wait 2.5s for "Intersection cleared. Resuming normal traffic." to finish
        }

        // Emit live location over socket if available (But skip if real GPS is taking over)
        if (window.socket && currentUser.role === 'driver' && !window.useDeviceGPS) {
             window.socket.emit('driver-location', {
                  lat: lat,
                  lng: lng,
                  isEmergency: window.isEmergencyActive || false,
                  hospitalId: window.currentDestId
             });
        }
        
        // Follow marker
        if (progress % Math.max(1, Math.floor(dynamicSteps/10)) < 1) { 
            map.panTo([lat, lng]);
        }
        
        // Schedule next frame using the current dynamicSpeed
        if (isTripActive) {
            simulationInterval = setTimeout(runSimulationStep, dynamicSpeed);
        }
    };
    
    // Kick off the loop
    simulationInterval = setTimeout(runSimulationStep, dynamicSpeed);
};

window.stopDriverSimulation = function() {
    isTripActive = false;
    window.hasAutoTriggered = false;
    window.isStuckAtRed = false;
    window.demoPause = false;
    window.tailgateTriggered = false;
    window.carsSpawnedCity = false;
    window.predictiveTriggered = false;
    if (window.scenarioCars) {
        window.scenarioCars.forEach(car => map.removeLayer(car));
        window.scenarioCars = [];
    }
    if (simulationInterval) clearTimeout(simulationInterval);
};

function addAlertBox(message, type) {
    const box = document.getElementById('driverAlertsBox');
    const empty = document.getElementById('alertsEmptyState');
    const activeInstr = document.getElementById('activeInstruction');
    const statusText = document.getElementById('copilotStatusText');
    
    if (!box) return;
    if (empty) empty.classList.add('hidden');

    // Show floating mascot when trip starts
    const mascot = document.getElementById('floatingMascot');
    const mascotBubble = document.getElementById('mascotBubble');
    if (mascot && mascot.classList.contains('hidden')) {
        mascot.classList.remove('hidden');
        mascot.classList.add('flex', 'show');
        if (mascotBubble) {
            setTimeout(() => {
                mascotBubble.classList.remove('opacity-0', 'translate-y-2', 'scale-95', 'pointer-events-none');
                mascotBubble.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            }, 300);
        }
    }

    // Update Live Co-Pilot Card for major instructions
    if (activeInstr) {
        if (message.includes('In 50 meters') || message.includes('Instruction') || message.includes('AI Copilot') || type === 'warning') {
            const clean = message.replace('Instruction: ', '').replace('AI Copilot: ', '').replace('In 50 meters, ', '');

            // Animate words floating in one by one
            const words = clean.split(' ');
            activeInstr.innerHTML = words.map((w, i) =>
                `<span class="copilot-word" style="animation-delay:${i * 0.08}s">${w}&nbsp;</span>`
            ).join('');

            // Update mascot speech bubble animation
            if (mascotBubble) {
                mascotBubble.classList.add('scale-95', 'opacity-50');
                setTimeout(() => {
                    mascotBubble.classList.remove('scale-95', 'opacity-50');
                }, 150);
            }

            if (statusText) {
                statusText.textContent = type === 'warning' ? '⚠ Alert' : '● Live';
                statusText.className = `text-[10px] font-bold uppercase transition-colors ${type === 'warning' ? 'text-amber-500' : 'text-brand-500'}`;
            }
        }
    }


    const div = document.createElement('div');
    const icon = type === 'warning' ? '<i data-lucide="alert-triangle" class="text-amber-500 w-4 h-4"></i>' : 
                 type === 'success' ? '<i data-lucide="check-circle" class="text-green-500 w-4 h-4"></i>' :
                 '<i data-lucide="info" class="text-blue-500 w-4 h-4"></i>';
                 
    div.className = `p-2 rounded-lg flex items-start gap-2 border ${
        type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 
        type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 
        'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
    }`;
    
    div.innerHTML = `
        <div class="mt-0.5 flex-shrink-0">${icon}</div>
        <div class="flex-1 min-w-0">
           <div class="flex justify-between items-center mb-0.5">
               <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">${new Date().toLocaleTimeString()}</span>
               <span class="text-[8px] px-1 bg-slate-200 dark:bg-slate-700 rounded text-slate-500">${type.toUpperCase()}</span>
           </div>
           <span class="text-[11px] leading-tight dark:text-slate-300 block truncate">${message}</span>
        </div>
    `;
    
    box.insertBefore(div, box.firstChild);
    if (window.lucide) window.lucide.createIcons();
}
window.addAlertBox = addAlertBox;
window.startDeviceTracking = function() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    window.useDeviceGPS = true;
    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy, speed } = position.coords;
            lastGpsCoords = { latitude, longitude, accuracy, speed };
            
            console.log(`GPS Update: ${latitude}, ${longitude} (Acc: ${accuracy}m)`);
            
            // If we are in driver mode and have an active alert, emit the real GPS
            if (window.currentUser && window.currentUser.role === 'driver' && window.activeEmergencyAlert) {
                if (window.socket) {
                    window.socket.emit('ambulance-location-update', {
                        alertId: window.activeEmergencyAlert.alertId,
                        lat: latitude,
                        lng: longitude,
                        accuracy: accuracy,
                        speed: speed,
                        isRealGPS: true,
                        hospitalId: window.activeEmergencyAlert.hospitalId
                    });
                }
            }

            // Update local ambulance marker if it exists
            if (window.ambulanceMarker) {
                window.ambulanceMarker.setLatLng([latitude, longitude]);
            }
        },
        (error) => {
            console.error("GPS Tracking Error:", error);
            window.stopDeviceTracking();
            alert("GPS Error: " + error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );
};

window.stopDeviceTracking = function() {
    window.useDeviceGPS = false;
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    console.log("GPS Tracking Stopped");
};
