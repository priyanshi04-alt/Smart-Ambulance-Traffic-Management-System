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

    initChatbot();
});

function initChatbot() {
    const triggerBtn = document.getElementById('triggerChatBtn');
    const modal = document.getElementById('aiChatModal');
    const form = document.getElementById('aiChatForm');
    const input = document.getElementById('aiChatInput');
    const messages = document.getElementById('aiChatMessages');

    if (!triggerBtn || !modal || !form || !input || !messages) return;

    triggerBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        input.focus();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'flex items-start gap-3 justify-end';
        userMsg.innerHTML = `
            <div class="bg-brand-500 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                ${text}
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <i data-lucide="user" class="w-4 h-4 text-slate-600 dark:text-slate-300"></i>
            </div>
        `;
        messages.appendChild(userMsg);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        if(window.lucide) window.lucide.createIcons();

        // Bot interactive response logic
        setTimeout(async () => {
            const botMsg = document.createElement('div');
            botMsg.className = 'flex items-start gap-3 w-full';
            
            const lowerText = text.toLowerCase();
            let responseText = "";

            // Conversational patterns
            const patterns = [
                {
                    match: /siren|trigger|clear|emergency|override/i,
                    responses: ["Executing override! Requesting green corridor immediately.", "Emergency protocol initiated. Clearing the path for the ambulance.", "Signal override triggered. Sirens are active."]
                },
                {
                    match: /start|trip|navigate|route/i,
                    responses: ["Starting navigation sequence to the selected hospital.", "Route calculated. Beginning navigation now."]
                },
                {
                    match: /(list|near|closest|around|nearby|show).*(hospital|hospitals)/i,
                    responses: ["Based on our Smart Corridor Network, here are the nearest registered emergency hospitals:<br><br>🏥 1. <strong>City General Hospital</strong> (Connaught Place) - 1.2 km away [ICU & ER available]<br>🏥 2. <strong>Apollo Life Care</strong> (Barakhamba Road) - 1.8 km away [Trauma Center active]<br>🏥 3. <strong>Metro Heart Institute</strong> (Gole Market) - 2.1 km away [Cardiac wing ready]<br><br>Would you like me to calculate or plot a route to any of these?"]
                },
                {
                    match: /(hospital|hospitals).*(list|near|closest|around|nearby|show)/i,
                    responses: ["Based on our Smart Corridor Network, here are the nearest registered emergency hospitals:<br><br>🏥 1. <strong>City General Hospital</strong> (Connaught Place) - 1.2 km away [ICU & ER available]<br>🏥 2. <strong>Apollo Life Care</strong> (Barakhamba Road) - 1.8 km away [Trauma Center active]<br>🏥 3. <strong>Metro Heart Institute</strong> (Gole Market) - 2.1 km away [Cardiac wing ready]<br><br>Would you like me to calculate or plot a route to any of these?"]
                },
                {
                    match: /chemist|pharmacy|pharmacies|medical\s+shop|medicine/i,
                    responses: ["Here are the nearest 24/7 chemist and pharmacy shops around your current emergency route:<br><br>💊 1. <strong>ResQ Med Store</strong> (Adjacent to Main Junction Node) - 0.2 km away [Open 24/7 - Emergency Meds & Oxygen available]<br>💊 2. <strong>Apollo Pharmacy</strong> (Radial Road 3, Connaught Place) - 0.8 km away [Open 24/7 - Home Delivery active]<br>💊 3. <strong>Fortis Healthworld</strong> (Janpath Crossing) - 1.1 km away [8:00 AM - 11:00 PM]<br>💊 4. <strong>Jeevan Chemist</strong> (Ashoka Road, near South Node) - 1.4 km away [Open 24/7]<br><br>Do you need navigation or contact info for the nearest pharmacy?"]
                },
                {
                    match: /hospital|notify/i,
                    responses: ["Hospital notified of incoming emergency and patient vitals.", "Alert sent to the destination hospital. They are on standby."]
                },
                {
                    match: /status|traffic|congestion/i,
                    responses: ["Traffic signals are currently running in standard cyclic mode. No active corridors.", "Current traffic flow is normal. Corridors are clear for emergency vehicles."]
                },
                {
                    match: /bed|icu|availability/i,
                    responses: [
                        () => `We currently have ${document.getElementById('icuCount')?.textContent || '3'} ICU beds available and 5 Emergency Ward beds ready. Operation Theater is on standby.`
                    ]
                },
                {
                    match: /eta|time|arrive/i,
                    responses: [
                        () => {
                            const eta = document.getElementById('hospitalEtaTimer')?.textContent || 'N/A';
                            return (eta !== '--:--' && eta !== 'N/A') 
                                ? `The closest ambulance is approximately ${eta} away.` 
                                : "There are currently no active incoming ambulances with an ETA.";
                        }
                    ]
                },
                {
                    match: /patient|sneha|details|vitals/i,
                    responses: ["Patient Sneha Reddy (PT-1004) is en route. Critical condition. Blood Group A+ POS. Allergies: Aspirin. Vitals are being monitored continuously via Med-Link."]
                },
                {
                    match: /doctor|staff|nurse/i,
                    responses: ["Dr. Sharma (Trauma) and Nurse Mehra (ER) have been assigned and notified. OT Team 4 is on standby."]
                },
                {
                    match: /\b(hi|hello|hey|greetings)\b/i,
                    responses: ["Hello! I am your ResQ Bot. I can assist with route status, hospital availability, patient information, and overriding traffic signals. What do you need?", "Hi there! ResQ Bot at your service. How can I help today?"]
                },
                {
                    match: /how are you/i,
                    responses: ["I'm operating at 100% efficiency and ready to assist with emergency routing! How can I help you?", "All systems are green. Ready to manage traffic and ambulances!"]
                },
                {
                    match: /thank/i,
                    responses: ["You're welcome! Let me know if you need any further assistance.", "Glad to help! Stay safe."]
                },
                {
                    match: /who are you|what are you/i,
                    responses: ["I am the ResQ Bot, an AI assistant dedicated to managing ambulance traffic overrides and hospital coordination."]
                },
                {
                    match: /weather|temperature/i,
                    responses: ["I'm optimized for traffic and medical routing, but I hope the roads are clear out there!"]
                },
                {
                    match: /\b(yes|ok|okay|sure)\b/i,
                    responses: ["Great! Let me know if you need anything else.", "Acknowledged. Standing by."]
                },
                {
                    match: /\b(no|cancel)\b/i,
                    responses: ["Understood. Canceling previous action.", "Alright, standing down."]
                },
                {
                    match: /\bname\b/i,
                    responses: ["My name is ResQ Bot! I am the intelligent assistant for the Smart Ambulance system."]
                },
                {
                    match: /joke|funny/i,
                    responses: ["Why did the ambulance cross the road? To get to the hospital on the other side... in a green corridor!", "What do you call an ambulance that plays music? A jam-bulance!"]
                }
            ];

            let matched = false;
            
            // 1. Try backend Generative AI Chatbot (Gemini) first for general queries
            // Skip Gemini for active physical command triggers to keep offline demo safety
            const isPhysicalCommand = /siren|trigger|clear|emergency|override|start\s*trip|navigate|notify\s*hospital/i.test(lowerText);
            
            if (!isPhysicalCommand) {
                try {
                    const aiRes = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text })
                    });
                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        if (aiData.success && aiData.response) {
                            responseText = aiData.response;
                            matched = true;
                        }
                    }
                } catch (err) {
                    console.warn("Backend AI chat failed or not set up, using local rules.", err);
                }
            }

            // 2. Local rule-based patterns (for command triggers and offline fallback)
            if (!matched) {
                for (const p of patterns) {
                    if (p.match.test(lowerText)) {
                        const resp = p.responses[Math.floor(Math.random() * p.responses.length)];
                        responseText = typeof resp === 'function' ? resp() : resp;
                        matched = true;
                        
                        // Side effects
                        if (p.match.toString().includes('siren')) {
                            fetch(`${window.apiBaseUrl || ''}/api/iot/ambulance-detected`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ direction: 'north', active: true })
                            }).catch(console.error);
                        } else if (p.match.toString().includes('start')) {
                            const startBtn = document.getElementById('startTripBtn');
                            if(startBtn) startBtn.click();
                        } else if (p.match.toString().includes('hospital') && !lowerText.includes('list') && !lowerText.includes('near')) {
                            const notifyBtn = document.getElementById('notifyHospitalBtn');
                            if(notifyBtn) notifyBtn.click();
                        }
                        break;
                    }
                }
            }

            if (!matched) {
                // Interactive fallback: Wikipedia API for dynamic answers to general queries
                try {
                    // Extract query by removing common filler words
                    let searchParam = text.replace(/what is|who is|tell me about|explain|do you know/gi, '').trim();
                    if (searchParam.endsWith('?')) searchParam = searchParam.slice(0, -1).trim();
                    
                    if (searchParam.length > 2) {
                        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchParam)}`);
                        if (wikiRes.ok) {
                            const wikiData = await wikiRes.json();
                            if (wikiData.extract && wikiData.type !== 'disambiguation') {
                                // Take first two sentences
                                responseText = wikiData.extract.split('. ').slice(0, 2).join('. ') + '.';
                            }
                        }
                    }
                } catch(e) {
                    console.warn("Wikipedia fallback failed", e);
                }

                if (!responseText) {
                    const fallbacks = [
                        "I didn't quite catch that. Could you rephrase your question about ambulances or traffic?",
                        "I'm specialized in ResQRoute operations. Try asking about hospital beds, ETAs, or emergency overrides.",
                        "That's an interesting question. My main focus is managing emergency traffic and hospital data. How can I assist you with those?"
                    ];
                    responseText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                }
            }

            botMsg.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <i data-lucide="bot" class="w-4 h-4 text-brand-600 dark:text-brand-400"></i>
                </div>
                <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
                    ${responseText}
                </div>
            `;
            messages.appendChild(botMsg);
            messages.scrollTop = messages.scrollHeight;
            if(window.lucide) window.lucide.createIcons();
            if (window.speak) window.speak(responseText);

        }, 600 + Math.random() * 800); // Varied response time for realism
    });
}

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

// ===== DRAGGABLE MASCOT =====
function initDraggableMascot() {
    const el = document.getElementById('floatingMascot');
    if (!el) return;

    // Restore saved position
    const saved = JSON.parse(localStorage.getItem('mascotPos') || 'null');
    if (saved) {
        el.style.left = saved.left;
        el.style.top  = saved.top;
        el.style.right  = 'auto';
        el.style.bottom = 'auto';
    }

    let dragging = false, ox = 0, oy = 0;

    function onStart(e) {
        dragging = true;
        el.style.cursor = 'grabbing';
        el.style.animation = 'none';
        const touch = e.touches ? e.touches[0] : e;
        const rect = el.getBoundingClientRect();
        ox = touch.clientX - rect.left;
        oy = touch.clientY - rect.top;
        e.preventDefault();
    }

    function onMove(e) {
        if (!dragging) return;
        const touch = e.touches ? e.touches[0] : e;
        let x = touch.clientX - ox;
        let y = touch.clientY - oy;
        // Clamp inside viewport
        x = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  x));
        y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, y));
        el.style.left   = x + 'px';
        el.style.top    = y + 'px';
        el.style.right  = 'auto';
        el.style.bottom = 'auto';
        e.preventDefault();
    }

    function onEnd() {
        if (!dragging) return;
        dragging = false;
        el.style.cursor  = 'grab';
        el.style.animation = '';
        localStorage.setItem('mascotPos', JSON.stringify({ left: el.style.left, top: el.style.top }));
    }

    el.addEventListener('mousedown',  onStart, { passive: false });
    window.addEventListener('mousemove', onMove,  { passive: false });
    window.addEventListener('mouseup',   onEnd);

    el.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove',  onMove, { passive: false });
    window.addEventListener('touchend',   onEnd);
}

document.addEventListener('DOMContentLoaded', initDraggableMascot);

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainHeader').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    const triggerChatBtn = document.getElementById('triggerChatBtn');
    if (triggerChatBtn) triggerChatBtn.classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainHeader').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    
    document.getElementById('userRoleBadge').textContent = currentUser.role;
    
    // Show/hide admin-only navbar controls
    const navAddUserBtn = document.getElementById('navAddUserBtn');
    if (navAddUserBtn) {
        if (currentUser.role === 'admin') {
            navAddUserBtn.classList.remove('hidden');
            navAddUserBtn.classList.add('flex');
        } else {
            navAddUserBtn.classList.add('hidden');
            navAddUserBtn.classList.remove('flex');
        }
    }
    
    // Always show the global chatbot floating button when logged in
    const triggerChatBtn = document.getElementById('triggerChatBtn');
    if (triggerChatBtn) triggerChatBtn.classList.remove('hidden');
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full h-full flex flex-col';

    if (currentUser.role === 'admin') {
        const template = document.getElementById('adminDashboardTemplate');
        wrapper.appendChild(template.content.cloneNode(true));
        mainContent.appendChild(wrapper);
        initAdminDashboard();
    } else if (currentUser.role === 'driver') {
        const template = document.getElementById('driverDashboardTemplate');
        wrapper.appendChild(template.content.cloneNode(true));
        mainContent.appendChild(wrapper);
        initDriverDashboard();
    } else if (currentUser.role === 'hospital') {
        const template = document.getElementById('hospitalDashboardTemplate');
        wrapper.appendChild(template.content.cloneNode(true));
        mainContent.appendChild(wrapper);
        initHospitalDashboard();
    }
    
    // Re-initialize icons for newly added DOM elements
    lucide.createIcons();
    
    // Connect Socket.io after auth
    if (window.initSocket) window.initSocket();
    
    // Build floating navigation after DOM is ready
    setTimeout(buildFloatingNav, 100);
}

function buildFloatingNav() {
    // Remove existing if any
    const existing = document.getElementById('floatingQuickNav');
    if (existing) existing.remove();

    const sections = document.querySelectorAll('#mainContent .glass-panel');
    if (sections.length === 0) return;

    const navContainer = document.createElement('div');
    navContainer.id = 'floatingQuickNav';
    // Sleek vertical pill container
    navContainer.className = 'fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-1 p-1.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-full shadow-xl border border-slate-200/50 dark:border-slate-700/50';

    sections.forEach((section, index) => {
        const titleEl = section.querySelector('h3');
        if (!titleEl) return;
        
        const titleText = titleEl.textContent.trim();
        
        // Extract icon name properly, handling both pre-render <i> and post-render <svg>
        let iconName = 'hash';
        const iEl = titleEl.querySelector('i');
        const svgEl = titleEl.querySelector('svg');
        
        if (iEl && iEl.hasAttribute('data-lucide')) {
            iconName = iEl.getAttribute('data-lucide');
        } else if (svgEl) {
            const classAttr = svgEl.getAttribute('class') || '';
            const match = classAttr.match(/lucide-([a-zA-Z0-9-]+)/);
            if (match) {
                iconName = match[1];
            }
        }

        // Give section an ID if it doesn't have one
        const sectionId = section.id || `section-nav-${index}`;
        section.id = sectionId;

        const btn = document.createElement('button');
        // Sleeker button style
        btn.className = 'w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all relative group';
        
        btn.innerHTML = `
            <i data-lucide="${iconName}" class="w-4 h-4 pointer-events-none"></i>
            <span class="absolute right-full mr-3 opacity-0 group-hover:opacity-100 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap transition-opacity pointer-events-none shadow-lg">${titleText}</span>
        `;
        
        btn.onclick = () => {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a brief highlight effect
            section.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'transition-shadow', 'duration-500');
            setTimeout(() => {
                section.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
            }, 1500);
        };
        
        navContainer.appendChild(btn);
    });

    // Only append if it actually has buttons
    if (navContainer.children.length > 0) {
        document.body.appendChild(navContainer);
        if (window.lucide) window.lucide.createIcons();
    }
}

function initTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('themeToggleBtn');
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    
    const isDark = localStorage.getItem('theme') === 'dark';
                  
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
                await fetch('/api/iot/manual-override', {
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
    
    // Global City-Wide Simulation Function
    window.runCitySimulation = function() {
        console.log("Starting City-Wide Simulation...");
        if (window.addAlertBox) window.addAlertBox("City Simulation Started: Tracking AMB-SIM-01", "info");
        
        const path = [
            { lat: 28.6110, lng: 77.2090 },
            { lat: 28.6120, lng: 77.2090 },
            { lat: 28.6130, lng: 77.2090 },
            { lat: 28.6139, lng: 77.2090 },
            { lat: 28.6150, lng: 77.2090 },
            { lat: 28.6160, lng: 77.2100 },
            { lat: 28.6170, lng: 77.2120 },
            { lat: 28.6180, lng: 77.2140 },
            { lat: 28.6200, lng: 77.2150 } 
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i >= path.length) {
                clearInterval(interval);
                if (window.addAlertBox) window.addAlertBox("Simulation Complete: Arrival at Hospital", "success");
                return;
            }
            if (window.socket) {
                const data = {
                    alertId: 'AMB-SIM-01',
                    lat: path[i].lat,
                    lng: path[i].lng,
                    hospitalId: 'city'
                };
                window.socket.emit('ambulance-location-update', data);
                
                // ALSO update local map immediately so the user sees it
                if (window.adminMap) {
                    if (!window.adminAmbulanceMarkers) window.adminAmbulanceMarkers = {};
                    const ambId = data.alertId;
                    if (window.adminAmbulanceMarkers[ambId]) {
                        window.adminAmbulanceMarkers[ambId].setLatLng([data.lat, data.lng]);
                    } else {
                        const iconHtml = `<div class="w-10 h-10 flex items-center justify-center relative">
                                           <div class="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                                           <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-brand-500 amb-marker-pulse relative z-10">
                                              <i data-lucide="ambulance" class="w-4 h-4 text-brand-600"></i>
                                           </div>
                                         </div>`;
                        window.adminAmbulanceMarkers[ambId] = L.marker([data.lat, data.lng], {
                            icon: L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] })
                        }).addTo(window.adminMap).bindPopup(`<b>Ambulance: ${ambId}</b><br>Simulation Active`);
                        if (window.lucide) window.lucide.createIcons();
                    }
                }
            }
            i++;
        }, 1500);
    };
    
    document.getElementById('disableEmergencyBtn').addEventListener('click', async () => {
         try {
             await fetch(`${window.apiBaseUrl || ''}/api/iot/manual-override`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ active: false })
             });
             if (window.addAlertBox) window.addAlertBox("City-wide emergency state cleared", "success");
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
            const roleEl = document.querySelector('input[name="newRole"]:checked');
            const role = roleEl ? roleEl.value : 'driver';

            // --- FRONTEND STRONG PASSWORD CHECK (DISABLED FOR DEMO) ---
            if (password.length < 3) {
                addUserStatus.textContent = "Password must be at least 3 characters.";
                addUserStatus.classList.remove('hidden', 'text-green-500', 'text-slate-400');
                addUserStatus.classList.add('text-red-500');
                return;
            }

            addUserStatus.textContent = "Creating user...";
            addUserStatus.classList.remove('hidden', 'text-green-500', 'text-red-500', 'bg-red-50', 'bg-green-50');
            addUserStatus.classList.add('text-slate-600', 'bg-slate-100');

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
                    addUserStatus.textContent = "✔ User created successfully!";
                    addUserStatus.classList.remove('text-slate-600', 'bg-slate-100');
                    addUserStatus.classList.add('text-green-600', 'bg-green-100');
                    addUserForm.reset();
                    if (window.speak) window.speak("New login created successfully.");
                    
                    if (window.lucide) window.lucide.createIcons();
                    
                    // Close modal automatically on success
                    setTimeout(() => {
                        const modal = document.getElementById('addUserModal');
                        if (modal) modal.classList.add('hidden');
                        addUserStatus.classList.add('hidden');
                    }, 1500);
                } else {
                    addUserStatus.textContent = "❌ " + (data.message || "Failed to create user");
                    addUserStatus.classList.remove('text-slate-600', 'bg-slate-100');
                    addUserStatus.classList.add('text-red-600', 'bg-red-100');
                    setTimeout(() => addUserStatus.classList.add('hidden'), 5000);
                }
            } catch (err) {
                console.error(err);
                addUserStatus.textContent = "❌ Server error. Please check backend.";
                addUserStatus.classList.remove('text-slate-600', 'bg-slate-100');
                addUserStatus.classList.add('text-red-600', 'bg-red-100');
                setTimeout(() => addUserStatus.classList.add('hidden'), 5000);
            }
        });
    }

    // Init Maps
    setTimeout(() => {
        if (window.initMap) window.initMap('adminCityMap', 'admin');
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
        
    const activeInstr = document.getElementById('activeInstruction');
    if (activeInstr) activeInstr.textContent = 'Waiting...';

    // Hide floating mascot
    const mascot = document.getElementById('floatingMascot');
    const mascotBubble = document.getElementById('mascotBubble');
    if (mascot) {
        mascot.classList.add('hidden');
        mascot.classList.remove('flex', 'show');
    }
    if (mascotBubble) {
        mascotBubble.classList.add('opacity-0', 'translate-y-2', 'scale-95');
        mascotBubble.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    }
    
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
    
    // Render demo patient database
    const demoPatients = [
        { id: 'PT-1004', name: 'Sneha Reddy', age: 41, gender: 'F', type: 'GENERAL', dept: 'EMERGENCY', severity: 'CRITICAL', blood: 'A+ POS', allergies: 'ASPIRIN', hr: '78', spo2: '67%', bp: '120/80', match: 'DB MATCH FOUND', matchClass: 'bg-brand-100 text-brand-700' },
        { id: 'PT-1001', name: 'Aarav Sharma', age: 54, gender: 'M', type: 'CARDIAC', dept: 'ICU', severity: 'CRITICAL', blood: 'B+ POS', allergies: 'PENICILLIN', hr: '110', spo2: '88%', bp: '150/90', match: 'DB MATCH FOUND', matchClass: 'bg-brand-100 text-brand-700' },
        { id: 'PT-1002', name: 'Priya Patel', age: 28, gender: 'F', type: 'TRAUMA', dept: 'SURGERY', severity: 'MODERATE', blood: 'O- NEG', allergies: 'NONE', hr: '95', spo2: '98%', bp: '110/70', match: 'DB MATCH FOUND', matchClass: 'bg-brand-100 text-brand-700' }
    ];

    const dbContainer = document.getElementById('demoPatientDatabase');
    if (dbContainer) {
        dbContainer.innerHTML = demoPatients.map(p => `
            <div class="p-2 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition flex justify-between items-center patient-card" data-id="${p.id}">
                <div>
                    <div class="font-bold text-slate-700 dark:text-slate-200 text-xs">${p.name}</div>
                    <div class="text-[9px] text-slate-500">${p.age} Yrs • ${p.blood} • ${p.match}</div>
                </div>
                <div class="text-xs font-black text-slate-400">${p.id}</div>
            </div>
        `).join('');

        dbContainer.querySelectorAll('.patient-card').forEach(card => {
            card.addEventListener('click', () => {
                const p = demoPatients.find(x => x.id === card.dataset.id);
                if (p) {
                    document.getElementById('patientInfoName').textContent = `[${p.id}] ${p.name}`;
                    const matchStatus = document.getElementById('patientMatchStatus');
                    matchStatus.textContent = p.match;
                    matchStatus.className = `bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest ml-2`;
                    
                    document.getElementById('patientInfoAge').textContent = `Age: ${p.age}`;
                    document.getElementById('patientInfoGender').textContent = `Gender: ${p.gender}`;
                    document.getElementById('patientInfoType').textContent = p.type;
                    document.getElementById('patientInfoDept').textContent = p.dept;
                    document.getElementById('patientInfoSeverity').textContent = p.severity;
                    document.getElementById('patientInfoBlood').textContent = p.blood;
                    document.getElementById('patientInfoAllergies').textContent = p.allergies;
                    
                    document.getElementById('vitalsHR_Hosp').textContent = p.hr;
                    document.getElementById('vitalsSPO2_Hosp').textContent = p.spo2;
                    document.getElementById('vitalsBP_Hosp').textContent = p.bp;

                    
                    // Sync with Digital Chart State for History Records
                    window.currentPatientChart = { 
                        ambId: p.id, 
                        patientName: p.name,
                        severity: p.severity, 
                        problem: `Retrieved from Hospital Database. Clinical history of ${p.type}.`, 
                        hr: p.hr, 
                        spo2: p.spo2.replace('%',''), 
                        bp: p.bp,
                        temp: '98.6', // Default for history demo
                        triage: "Database match. Ready for immediate admission." 
                    };
                }
            });
        });
    }

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
    
    const patientNameInput = document.getElementById('patientName')?.value || '';
    
    // New Advanced Vitals
    const spo2 = document.getElementById('vitalsSPO2')?.value || '98';
    const hr = document.getElementById('vitalsHR')?.value || '75';
    const blood = document.getElementById('vitalsBlood')?.value || 'O+';
    const requirements = document.getElementById('vitalsReq')?.value || 'None';

    if (!problem || !problem.trim()) {
        problem = "Emergency Response Requested"; // Default filler so user demo doesn't fail silently
    }
    
    if (patientNameInput.trim()) {
        problem = `[Patient: ${patientNameInput}] ${problem}`;
    }

    const alertBtn = document.getElementById('notifyHospitalBtn');
    alertBtn.disabled = true;
    alertBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Notifying...';
    lucide.createIcons();

    if (window.socket) {
        window.socket.emit('hospital-alert', {
            driverId: currentUser.id,
            driverName: currentUser.username,
            patientName: patientNameInput,
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
    if (e && (e.target.id === 'strategicBroadcastBtn' || e.target.closest('#strategicBroadcastBtn'))) {
        const input = document.getElementById('strategicBroadcastInput');
        if (input && input.value.trim()) {
            const val = input.value.trim();
            
            // Manage rolling history (last 3)
            if (!window.recentBroadcasts) window.recentBroadcasts = [];
            window.recentBroadcasts.push({
                msg: val,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            if (window.recentBroadcasts.length > 3) window.recentBroadcasts.shift();

            // Update UI container
            const container = document.getElementById('broadcastLogsContainer');
            if (container) {
                container.innerHTML = window.recentBroadcasts.map(b => `
                    <div class="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-xl p-2.5 shadow-inner animate-in slide-in-from-bottom-2">
                        <p class="text-[10px] font-bold text-slate-700 dark:text-slate-300 italic leading-tight">"${b.msg}"</p>
                        <div class="text-[7px] font-black text-orange-500 uppercase tracking-widest mt-1 opacity-60">Broadcasted at ${b.time}</div>
                    </div>
                `).join('');
            }

            if (window.addAlertBox) window.addAlertBox("Strategic Broadcast Sent", "success");
            input.value = '';
        }
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
        openDigitalChart();
    }
});

window.openDigitalChart = function() {
    const modal = document.getElementById('digitalChartModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Let's populate the chart with the current patient data if available
        const nameHeader = document.getElementById('patientInfoName')?.textContent || '';
        if (nameHeader && nameHeader.includes('PT-')) {
            const patientName = nameHeader.replace(/\[PT-\d+\]/, '').trim();
            const ageStr = document.getElementById('patientInfoAge')?.textContent || '';
            const typeStr = document.getElementById('patientInfoType')?.textContent || '';
            const severityStr = document.getElementById('patientInfoSeverity')?.textContent || '';
            
            document.getElementById('modalAmbId').textContent = 'LOCAL-HOSP';
            document.getElementById('modalSeverity').textContent = severityStr;
            document.getElementById('modalProblem').textContent = `Patient ${patientName}. ${ageStr}. Case: ${typeStr}. Records retrieved from DB.`;
            document.getElementById('modalHR').textContent = document.getElementById('vitalsHR_Hosp')?.textContent + ' BPM' || '-- BPM';
            document.getElementById('modalSPO2').textContent = document.getElementById('vitalsSPO2_Hosp')?.textContent || '-- %';
            document.getElementById('modalAITriage').textContent = 'Patient history matches incoming vitals. Standard ER protocol.';
        }
    }
};
