let currentUser = null;
window.tripStats = { distance: 0, overrides: 0, startTime: null };

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Theme toggle logic
    initTheme();
    
    // Check Auth
    const token = localStorage.getItem('token');
    if (token) {
        // Assume valid token for demo. In real app, call /api/user/me
        const userJson = localStorage.getItem('user');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            showDashboard();
        } else {
            showLogin();
        }
    } else {
        showLogin();
    }
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout (Using event delegation since button may be dynamically added/removed via templates)
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
            e.preventDefault();
            handleLogout();
        }
    });
});

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${window.apiBaseUrl || ''}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showDashboard();
        } else {
            errorMsg.textContent = data.message;
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        errorMsg.textContent = 'Server connection failed';
        errorMsg.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.clear();
    currentUser = null;
    window.location.href = '/';
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainHeader').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainHeader').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    
    document.getElementById('userRoleBadge').textContent = currentUser.role;
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';
    
    if (currentUser.role === 'admin') {
        const template = document.getElementById('adminDashboardTemplate');
        const clone = template.content.cloneNode(true);
        console.log("Template cloned. Elements in clone:", clone.children.length);
        mainContent.appendChild(clone);
        console.log("Template appended. mainContent HTML length:", mainContent.innerHTML.length);
        initAdminDashboard();
    } else if (currentUser.role === 'driver') {
        const template = document.getElementById('driverDashboardTemplate');
        mainContent.appendChild(template.content.cloneNode(true));
        initDriverDashboard();
    } else if (currentUser.role === 'hospital') {
        const template = document.getElementById('hospitalDashboardTemplate');
        mainContent.appendChild(template.content.cloneNode(true));
        initHospitalDashboard();
    }
    
    // Re-initialize icons for newly added DOM elements
    lucide.createIcons();
    
    // Connect Socket.io after auth
    if (window.initSocket) window.initSocket();
}

function initTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('themeToggleBtn');
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
    if (isDark) {
        html.classList.add('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        html.classList.remove('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
    
    themeBtn.addEventListener('click', () => {
        html.classList.toggle('dark');
        moonIcon.classList.toggle('hidden');
        sunIcon.classList.toggle('hidden');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
}


// Global state for audio
window.isMuted = false;

// Attach global mute button listener
document.addEventListener('DOMContentLoaded', () => {
    const muteBtn = document.getElementById('muteBtn');
    // Store innerHTML templates to ensure lucide picks up fresh `i` tags
    const iconMuted = `<i data-lucide="volume-x" class="w-5 h-5 text-red-500"></i>`;
    const iconUnmuted = `<i data-lucide="volume-2" class="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-red-500"></i>`;
    
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            window.isMuted = !window.isMuted;
            muteBtn.innerHTML = window.isMuted ? iconMuted : iconUnmuted;
            
            if (window.isMuted) {
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel(); // Stop anything currently talking
                    // Bypass our wrapper to announce the mute action itself
                    const utterance = new SpeechSynthesisUtterance("Audio disabled");
                    utterance.rate = 1.0;
                    window.speechSynthesis.speak(utterance);
                }
                if (window.stopSiren) window.stopSiren();
            } else {
                if (window.speak) window.speak("Audio notifications enabled.");
            }
            lucide.createIcons();
        });
    }
});

function initAdminDashboard() {
    console.log("Admin dashboard initialized");
    
    // Initial Signal Status Fetch - Use a more robust check with cache busting
    const fetchUrl = `${window.apiBaseUrl || ''}/api/iot/signal-status?t=${Date.now()}`;
    console.log(`Fetching initial signal status from ${fetchUrl}...`);
    fetch(fetchUrl)
        .then(async res => {
            const contentType = res.headers.get("content-type");
            console.log(`Response status: ${res.status}, Content-Type: ${contentType}`);
            if (res.ok && contentType && contentType.includes("application/json")) {
                return res.json();
            }
            const text = await res.text();
            console.error("Received non-JSON response (first 100 chars):", text.substring(0, 100));
            throw new Error("Invalid response from server");
        })
        .then(state => {
            console.log("Initial traffic state successfully parsed:", state);
            // Small delay to ensure template DOM is ready
            setTimeout(() => {
                console.log("Attempting to update visuals...");
                if (window.updateTrafficVisuals) {
                    window.updateTrafficVisuals(state);
                } else {
                    console.error("CRITICAL: window.updateTrafficVisuals is NOT defined!");
                }
            }, 1000);
        })
        .catch(err => {
            console.warn("Initial signal fetch failed, waiting for socket sync...", err);
        });

    // Binding Manual Overrides
    document.querySelectorAll('.btn-trigger').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const dir = e.currentTarget.dataset.dir;
            try {
                await fetch('/api/iot/ambulance-detected', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ direction: dir, active: true })
                });
                if (window.tripStats) window.tripStats.overrides++;
            } catch (err) {
                console.error(err);
            }
        });
    });
    
    document.getElementById('disableEmergencyBtn').addEventListener('click', async () => {
         try {
             await fetch(`${window.apiBaseUrl || ''}/api/iot/ambulance-detected`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ active: false })
             });
         } catch (err) {
             console.error(err);
         }
    });

    // Binding Density Sliders
    document.querySelectorAll('.density-range').forEach(slider => {
         slider.addEventListener('change', async (e) => {
             const dir = e.target.dataset.dir;
             const val = e.target.value;
             const valMap = { "1": "low", "2": "medium", "3": "high" };
             const level = valMap[val];
             
             try {
                 await fetch(`${window.apiBaseUrl || ''}/api/iot/traffic-density`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ direction: dir, level })
                 });
             } catch (err) {
                 console.error(err);
             }
         });
    });

    // User Management Form Handler
    const addUserForm = document.getElementById('addUserForm');
    const addUserStatus = document.getElementById('addUserStatus');

    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;

            // --- FRONTEND STRONG PASSWORD CHECK ---
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!strongPasswordRegex.test(password)) {
                addUserStatus.textContent = "Weak Password: 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Special Char required.";
                addUserStatus.classList.remove('hidden', 'text-green-500', 'text-slate-400');
                addUserStatus.classList.add('text-red-500');
                return;
            }

            addUserStatus.textContent = "Creating user...";
            addUserStatus.classList.remove('hidden', 'text-green-500', 'text-red-500');
            addUserStatus.classList.add('text-slate-400');

            try {
                const response = await fetch(`${window.apiBaseUrl || ''}/api/auth/register`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ username, password, role })
                });

                const data = await response.json();

                if (response.ok) {
                    addUserStatus.textContent = "User created successfully!";
                    addUserStatus.classList.replace('text-slate-400', 'text-green-500');
                    addUserForm.reset();
                    if (window.speak) window.speak("New login created successfully.");
                    lucide.createIcons(); // For any new status icons if added
                } else {
                    addUserStatus.textContent = data.message || "Failed to create user";
                    addUserStatus.classList.replace('text-slate-400', 'text-red-500');
                }
            } catch (err) {
                console.error(err);
                addUserStatus.textContent = "Server error";
                addUserStatus.classList.replace('text-slate-400', 'text-red-500');
            }

            setTimeout(() => {
                addUserStatus.classList.add('hidden');
            }, 3000);
        });
    }

    // Init Maps
    setTimeout(() => {
        if (window.initMap) window.initMap('adminCityMap', 'admin');
        if (window.initAdminSecondaryMap) window.initAdminSecondaryMap('adminGlobalMap');
    }, 500); 

    // Create icons again after template injection
    if (window.lucide) window.lucide.createIcons();

    // Verify presence of critical elements
    console.log("Checking for intersection elements:", 
        document.getElementById('sig-north') ? "Found" : "Missing");
}

let activeWaypoints = [];
function initDriverDashboard() {
    console.log("Driver dashboard initialized");
    
    // UI Elements
    const hospitalSelect = document.getElementById('hospitalSelect');
    const startTripBtn = document.getElementById('startTripBtn');
    const stopTripBtn = document.getElementById('stopTripBtn');
    const emergencyBtn = document.getElementById('driverEmergencyBtn');
    const statusBadge = document.getElementById('tripStatusBadge');
    
    // Init Map
    setTimeout(() => {
        if (window.initMap) window.initMap('driverMap', 'driver');
    }, 500);

    // 4. GPS Toggle Handler
    const gpsToggle = document.getElementById('toggleGPSTracking');
    const gpsHandle = document.getElementById('gpsToggleHandle');
    if (gpsToggle && gpsHandle) {
        gpsToggle.addEventListener('click', () => {
            const isActive = gpsHandle.classList.contains('translate-x-5');
            if (isActive) {
                // Turn OFF
                gpsHandle.classList.replace('translate-x-5', 'translate-x-0');
                gpsToggle.classList.replace('bg-brand-600', 'bg-slate-200');
                if (window.stopDeviceTracking) window.stopDeviceTracking();
            } else {
                // Turn ON
                gpsHandle.classList.replace('translate-x-0', 'translate-x-5');
                gpsToggle.classList.replace('bg-slate-200', 'bg-brand-600');
                if (window.startDeviceTracking) window.startDeviceTracking();
            }
        });
    }

    // Trip Start
    startTripBtn.addEventListener('click', () => {
        console.log("Start Trip clicked. Status:", { 
            proposedWaypoints: !!window.proposedWaypoints,
            hospitalValue: hospitalSelect.value 
        });

        const handleSimulationStart = (waypoints, destName) => {
            console.log("Simulating trip to:", destName, "Waypoints count:", waypoints?.length);
            
            // Reset and Start Analytics
            window.tripStats = { distance: 0, overrides: 0, startTime: Date.now() };
            if (!waypoints || waypoints.length === 0) {
                console.error("Simulation failed: No waypoints provided.");
                statusBadge.textContent = 'Route Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
                return;
            }

            startTripBtn.classList.add('hidden');
            stopTripBtn.classList.remove('hidden');
            emergencyBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'hidden');
            
            // Show hospital notification panel
            const hospPanel = document.getElementById('hospitalNotificationPanel');
            if (hospPanel) hospPanel.classList.remove('hidden');

            statusBadge.textContent = 'En Route: ' + destName;
            statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800 animate-pulse';
            
            window.addAlertBox(`Route calculated for ${destName}`, 'info');
            window.startDriverSimulation(waypoints);
        };

        // Case A: User selected via Map Click
        if (window.proposedWaypoints) {
             console.log("Using map-proposed waypoints");
             activeWaypoints = window.proposedWaypoints;
             handleSimulationStart(activeWaypoints, "Custom Destination");
         } 
         // Case B: User selected via Dropdown
         else {
             const dest = hospitalSelect.value;
             const destName = hospitalSelect.options[hospitalSelect.selectedIndex].text;
             const destC = { city: [28.6200, 77.2150], metro: [28.6050, 77.2000], apollo: [28.6150, 77.2250] };
             
             console.log("Using dropdown destination:", dest, destName);
             window.currentDestId = dest;
             window.currentDestName = destName;
             
             // Immediate UI feedback
             startTripBtn.disabled = true;
             startTripBtn.innerHTML = '<i data-lucide="loader-circle" class="w-5 h-5 animate-spin"></i> Calculating...';
             statusBadge.textContent = 'Routing...';
             statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse';
             if(window.lucide) window.lucide.createIcons();
             
             window.calculateAndDrawRoute(destC[dest][0], destC[dest][1]).then(wp => {
                 console.log("Route calculation completed. Waypoints received:", !!wp);
                 activeWaypoints = wp;
                 
                 // Restore button state
                 startTripBtn.disabled = false;
                 startTripBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i> Start Navigation';
                 if(window.lucide) window.lucide.createIcons();
                 
                 handleSimulationStart(activeWaypoints, destName);
             }).catch(err => {
                 console.error("Route calculation error:", err);
                 startTripBtn.disabled = false;
                 startTripBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i> Start Navigation';
                 statusBadge.textContent = 'Error';
             });
         }
    });

    // Trip Stop
    window.resetDriverUI = function() {
        startTripBtn.classList.remove('hidden');
        stopTripBtn.classList.add('hidden');
        emergencyBtn.classList.add('opacity-50', 'cursor-not-allowed', 'hidden');
        
    const copilotCard = document.getElementById('aiCopilotActiveCard');
    if (copilotCard) copilotCard.classList.add('hidden');
    const activeInstr = document.getElementById('activeInstruction');
    if (activeInstr) activeInstr.innerHTML = 'Waiting for navigation to start...';
    
    const alertsBox = document.getElementById('driverAlertsBox');
    if (alertsBox) {
        alertsBox.innerHTML = ''; 
        const empty = document.getElementById('alertsEmptyState');
        if (empty) empty.classList.remove('hidden');
    }

    const hospPanel = document.getElementById('hospitalNotificationPanel');
    if (hospPanel) {
        hospPanel.classList.add('hidden');
        document.getElementById('hospitalStatusResponse').classList.add('hidden');
        document.getElementById('patientProblem').value = '';
        document.getElementById('criticalStatus').checked = false;
    }

    statusBadge.textContent = 'Idling';
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        
        // Deactivate emergency if active
        fetch(`${window.apiBaseUrl || ''}/api/iot/ambulance-detected`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ active: false })
        });
        
        window.stopDriverSimulation();
        
        // Show Analytics Summary
        if (window.tripStats.startTime) {
            showTripSummary();
        }
    };

    function showTripSummary() {
        const modal = document.getElementById('tripSummaryModal');
        if (!modal) return;

        const durationSec = Math.floor((Date.now() - window.tripStats.startTime) / 1000);
        const distanceStr = (window.tripStats.distance || (Math.random() * 2 + 3)).toFixed(1) + " km";
        const timeSaved = Math.floor(durationSec * 0.4); // Simulated 40% time saving
        const timeSavedStr = `${Math.floor(timeSaved / 60)}m ${timeSaved % 60}s`;

        document.getElementById('summaryDistance').textContent = distanceStr;
        document.getElementById('summaryTimeSaved').textContent = timeSavedStr;
        document.getElementById('summaryOverrides').textContent = (window.tripStats.overrides || Math.floor(Math.random() * 3 + 1)) + " Nodes";
        
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        if (window.speak) window.speak(`Mission accomplished. Distance covered: ${distanceStr}. Total time saved by Green Corridor: ${timeSavedStr}.`);
    }

    stopTripBtn.addEventListener('click', () => {
        window.resetDriverUI();
        window.addAlertBox("Demo Terminated.", "warning");
        if(window.speak) window.speak("Route aborted.");
    });

window.isEmergencyActive = false;
    // Emergency Green Corridor
    emergencyBtn.addEventListener('click', async () => {
        window.isEmergencyActive = !window.isEmergencyActive;
        
        if (window.isEmergencyActive) {
            // Activate
            try {
                await fetch(`${window.apiBaseUrl || ''}/api/iot/ambulance-detected`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ direction: 'south', active: true }) // Simulating coming from south
                });
                emergencyBtn.innerHTML = '<i data-lucide="shield-check" class="w-6 h-6 z-10"></i> <span class="z-10 tracking-wide drop-shadow-md">CORRIDOR SECURED</span>';
                emergencyBtn.classList.remove('from-red-600', 'to-red-500', 'border-red-400', 'shadow-[0_10px_20px_-10px_rgba(220,38,38,0.6)]');
                emergencyBtn.classList.add('from-green-600', 'to-green-500', 'border-green-400', 'shadow-[0_10px_20px_-10px_rgba(34,197,94,0.6)]', 'animate-pulse');
                
                window.addAlertBox("Green Corridor Request Granted by Server", "success");
            } catch (err) {
                console.error(err);
            }
        } else {
            // Deactivate
            try {
                await fetch('/api/iot/ambulance-detected', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: false })
                });
                emergencyBtn.innerHTML = '<div class="absolute inset-0 bg-white/20 skew-x-[-20deg] group-hover:block transition-transform transform translate-x-[-150%] group-hover:translate-x-[150%] duration-700"></div><i data-lucide="siren" class="w-6 h-6 z-10"></i> <span class="z-10 tracking-wide drop-shadow-md">REQUEST GREEN CORRIDOR</span>';
                emergencyBtn.classList.add('from-red-600', 'to-red-500', 'border-red-400', 'shadow-[0_10px_20px_-10px_rgba(220,38,38,0.6)]');
                emergencyBtn.classList.remove('from-green-600', 'to-green-500', 'border-green-400', 'shadow-[0_10px_20px_-10px_rgba(34,197,94,0.6)]', 'animate-pulse');
            } catch (err) {
                console.error(err);
            }
        }
        lucide.createIcons();
    });

    if (typeof reportHazardBtn !== 'undefined') {
        reportHazardBtn.addEventListener('click', async () => {
            try {
                await fetch(`${window.apiBaseUrl || ''}/api/iot/hazard-alert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'Congestion/Accident', location: 'Current Position' })
                });
                window.addAlertBox("Hazard broadcasted to network", "warning");
            } catch (err) {
                console.error(err);
            }
        });
    }
}

// Hospital Dashboard Controller
function initHospitalDashboard() {
    console.log("Initializing Hospital Dashboard...");
    
    // 1. Initialize Map with fix for hidden containers
    setTimeout(() => {
        const mapContainer = document.getElementById('hospitalMap');
        if (mapContainer && window.initMap) {
            window.initMap('hospitalMap', 'hospital');
            
            // Leaflet Fix: invalidateSize ensures the map tiles render correctly
            // if the container was hidden or resized during initialization
            if (window.hMap) {
                setTimeout(() => {
                    window.hMap.invalidateSize();
                }, 400);
            }
        }
    }, 500);

    // 2. Resource Simulation (For Demo)
    const updateResources = () => {
        const icu = document.getElementById('icuCount');
        const docs = document.getElementById('doctorsReadyCount');
        if (icu) icu.textContent = Math.floor(Math.random() * 5) + 1;
        if (docs) docs.textContent = Math.floor(Math.random() * 8) + 2;
    };
    
    updateResources();
    setInterval(updateResources, 30000); // Update every 30s

    // 3. Setup Internal Alerts Simulation
    const internalAlerts = [
        "Clear Trauma Room A-1 for incoming AMB-401",
        "OT Team 2 proceed to prep Room 4",
        "Cardiology consult requested in ER Bay 3",
        "Ventilator 5 moved to ICU Corridor"
    ];
    
    const alertEl = document.querySelector('.bg-orange-50 p');
    if (alertEl) {
        let alertIdx = 0;
        setInterval(() => {
            alertIdx = (alertIdx + 1) % internalAlerts.length;
            alertEl.classList.add('opacity-0');
            setTimeout(() => {
                alertEl.textContent = `"${internalAlerts[alertIdx]}"`;
                alertEl.classList.remove('opacity-0');
            }, 500);
        }, 8000);
    }
}

// Driver calling hospital
async function sendHospitalAlert() {
    let problem = document.getElementById('patientProblem').value;
    const critical = document.getElementById('criticalStatus').checked;
    const hospitalId = window.currentDestId;
    const hospitalName = window.currentDestName;
    
    // New Advanced Vitals
    const spo2 = document.getElementById('vitalsSPO2')?.value || '98';
    const hr = document.getElementById('vitalsHR')?.value || '75';
    const blood = document.getElementById('vitalsBlood')?.value || 'O+';
    const requirements = document.getElementById('vitalsReq')?.value || 'None';

    if (!problem || !problem.trim()) {
        problem = "Emergency Response Requested"; // Default filler so user demo doesn't fail silently
    }

    const alertBtn = document.getElementById('notifyHospitalBtn');
    alertBtn.disabled = true;
    alertBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Notifying...';
    lucide.createIcons();

    if (window.socket) {
        window.socket.emit('hospital-alert', {
            driverId: currentUser.id,
            driverName: currentUser.username,
            hospitalId,
            hospitalName,
            problem,
            critical,
            vitals: {
                spo2,
                hr,
                blood,
                requirements
            }
        });

        // Show status feedback
        const statusBox = document.getElementById('hospitalStatusResponse');
        const statusText = document.getElementById('hospResponseStatus');
        const statusMsg = document.getElementById('hospResponseMsg');

        if (statusBox && statusText && statusMsg) {
            statusBox.classList.remove('hidden', 'bg-green-100', 'border-green-300', 'bg-amber-100', 'border-amber-300');
            statusBox.classList.add('bg-slate-100', 'border-slate-300');
            statusText.textContent = 'SENT';
            statusText.className = 'text-xs font-black px-2 py-0.5 rounded bg-slate-200 text-slate-700';
            statusMsg.textContent = 'Awaiting acknowledgment from ' + hospitalName + '...';
        }

        setTimeout(() => {
            alertBtn.disabled = false;
            alertBtn.innerHTML = '<i data-lucide="bell-ring" class="w-5 h-5"></i> Notify Hospital';
            lucide.createIcons();
        }, 2000);
    }
}

// Global button listener (delegation)
document.addEventListener('click', (e) => {
    if (e && (e.target.id === 'notifyHospitalBtn' || e.target.closest('#notifyHospitalBtn'))) {
        sendHospitalAlert();
    }
    if (e && (e.target.id === 'sendReplyBtn' || e.target.closest('#sendReplyBtn'))) {
        sendDriverReply();
    }
});

async function sendDriverReply() {
    const msg = document.getElementById('driverReplyMsg').value;
    if (!msg.trim()) return;
    
    if (window.socket) {
        window.socket.emit('driver-to-hospital-message', {
            alertId: window.currentAlertId,
            driverName: currentUser.username,
            message: msg,
            hospitalId: window.currentDestId
        });
        document.getElementById('driverReplyMsg').value = '';
        
        // Local feedback
        const msgBox = document.getElementById('driverMessages');
        if (msgBox && msgBox.innerHTML.includes('No instructions...')) {
            msgBox.innerHTML = '';
            msgBox.classList.remove('italic');
        }
        if (msgBox) {
            msgBox.innerHTML += `<div class="mt-1"><span class="text-[10px] text-brand-400 font-bold uppercase">You:</span> ${msg}</div>`;
        }
    }
}

// Global delegated event listeners for specific action buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.textContent && btn.textContent.includes('View Digital Chart')) {
        alert('Digital Patient Chart & Medical History successfully retrieved from cloud database.');
    }
});
