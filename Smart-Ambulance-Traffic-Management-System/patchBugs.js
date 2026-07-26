const fs = require('fs');
const path = require('path');

// 1. Fix Civilian UI Contrast
const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldCiv = `<i data-lucide="map" class="w-8 h-8 text-slate-700 mb-2"></i>`;
const newCiv = `<i data-lucide="map" class="w-10 h-10 text-brand-400 mb-2 drop-shadow-md mx-auto"></i>`;
html = html.replace(oldCiv, newCiv);

const oldCivText = `<div class="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Navigation Active</div>`;
const newCivText = `<div class="text-[10px] text-slate-300 font-bold uppercase tracking-wide mt-1">Navigation Active</div>`;
html = html.replace(oldCivText, newCivText);

fs.writeFileSync(htmlPath, html, 'utf8');


// 2. Fix socket.js map marker logic loop
const socketPath = path.join(__dirname, 'public', 'js', 'socket.js');
let socketJs = fs.readFileSync(socketPath, 'utf8');

const markerBlock = `                // Update marker on Hospital Map
                if (window.hospitalAmbulanceMarker) {
                    window.hospitalAmbulanceMarker.setLatLng([data.lat, data.lng]);
                } else if (window.hMap) {
                    const ambIconHtml = \`
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ambulance"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h2"/><path d="M19 18h2a2 2 0 0 0 2-2v-3.26a1 1 0 0 0-.2-.6l-3-4.5a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="6" cy="18" r="2"/></svg>
                        </div>
                    \`;
                    window.hospitalAmbulanceMarker = L.marker([data.lat, data.lng], {
                        icon: L.divIcon({ html: ambIconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
                    }).addTo(window.hMap);
                }
            });
        }`;

const newMarkerLogic = `            });
        }

        // Global Map Marker Update for Admin and Hospital (Decoupled from Alerts)
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'hospital')) {
            const mapObj = currentUser.role === 'admin' ? window.adminMap : window.hMap;
            const markerRef = currentUser.role === 'admin' ? 'adminAmbulanceMarker' : 'hospitalAmbulanceMarker';
            
            if (mapObj) {
                if (window[markerRef]) {
                    window[markerRef].setLatLng([data.lat, data.lng]);
                } else {
                    const ambIconHtml = \`
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 animate-bounce">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ambulance"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h2"/><path d="M19 18h2a2 2 0 0 0 2-2v-3.26a1 1 0 0 0-.2-.6l-3-4.5a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="6" cy="18" r="2"/></svg>
                        </div>
                    \`;
                    window[markerRef] = L.marker([data.lat, data.lng], {
                        icon: L.divIcon({ html: ambIconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
                    }).addTo(mapObj);
                }
            }
        }`;

// Replace logic
if (socketJs.includes('window.hospitalAmbulanceMarker.setLatLng')) {
    // Modify the scope strictly
    socketJs = socketJs.replace(markerBlock, newMarkerLogic);

    // Make sure Hospital receives the location update even if currentUser === admin
    // Currently socket.on('ambulance-location-update') has: if (currentUser && currentUser.role === 'hospital')
    socketJs = socketJs.replace("if (currentUser && currentUser.role === 'hospital') {", "if (currentUser && (currentUser.role === 'hospital' || currentUser.role === 'admin')) {");
    fs.writeFileSync(socketPath, socketJs, 'utf8');
    console.log("socket.js logic patched.");
} else {
    console.log("Could not find markerBlock in socket.js");
}

console.log("Bug patching completed.");
