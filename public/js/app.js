let currentUser = null;

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
        const response = await fetch('/api/auth/login', {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
        mainContent.appendChild(template.content.cloneNode(true));
        initAdminDashboard();
    } else if (currentUser.role === 'driver') {
        const template = document.getElementById('driverDashboardTemplate');
        mainContent.appendChild(template.content.cloneNode(true));
        initDriverDashboard();
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
            } catch (err) {
                console.error(err);
            }
        });
    });
    
    document.getElementById('disableEmergencyBtn').addEventListener('click', async () => {
         try {
             await fetch('/api/iot/ambulance-detected', {
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
                 await fetch('/api/iot/traffic-density', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ direction: dir, level })
                 });
             } catch (err) {
                 console.error(err);
             }
         });
    });

    // Init Map
    setTimeout(() => {
        if (window.initMap) window.initMap('adminMap', 'admin');
    }, 500); // Wait for DOM to paint completely
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

    // Trip Start
    startTripBtn.addEventListener('click', () => {
        // Did the user select a destination (either from custom point or dropdown)
        if (window.proposedWaypoints) {
             activeWaypoints = window.proposedWaypoints;
             
             startTripBtn.classList.add('hidden');
             stopTripBtn.classList.remove('hidden');
         } else {
             // Fallback to the drop down menu if they didn't click
             const dest = hospitalSelect.value;
             const destName = hospitalSelect.options[hospitalSelect.selectedIndex].text;
             const destC = { city: [28.6200, 77.2150], metro: [28.6050, 77.2000], apollo: [28.6150, 77.2250] };
             
             window.currentDestId = dest;
             window.currentDestName = destName;
             
             // Immediate UI feedback
             startTripBtn.disabled = true;
             startTripBtn.innerHTML = '<i data-lucide="loader-circle" class="w-5 h-5 animate-spin"></i> Calculating Route...';
             statusBadge.textContent = 'Calculating...';
             statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse';
             if(window.lucide) window.lucide.createIcons();
             
             activeWaypoints = window.calculateAndDrawRoute(destC[dest][0], destC[dest][1]).then(wp => {
                 activeWaypoints = wp;
                 
                 // Restore button state
                 startTripBtn.disabled = false;
                 startTripBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i> Start Navigation';
                 if(window.lucide) window.lucide.createIcons();
                 
                 if (activeWaypoints) {
                     startTripBtn.classList.add('hidden');
                     stopTripBtn.classList.remove('hidden');
                     emergencyBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'hidden');
                     
                     statusBadge.textContent = 'En Route: ' + destName;
                     statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800 animate-pulse';
                     
                     window.addAlertBox(`Route calculated for ${destName}`, 'info');
                     window.startDriverSimulation(activeWaypoints);
                 } else {
                     statusBadge.textContent = 'Route Failed';
                     statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
                 }
             });
        }
    });

    // Trip Stop
    window.resetDriverUI = function() {
        startTripBtn.classList.remove('hidden');
        stopTripBtn.classList.add('hidden');
        emergencyBtn.classList.add('opacity-50', 'cursor-not-allowed', 'hidden');
        
        statusBadge.textContent = 'Idling';
        statusBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        
        // Deactivate emergency if active
        fetch('/api/iot/ambulance-detected', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ active: false })
        });
        
        window.stopDriverSimulation();
    };

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
                await fetch('/api/iot/ambulance-detected', {
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

    reportHazardBtn.addEventListener('click', async () => {
         try {
             await fetch('/api/iot/hazard-alert', {
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
