let socket;

window.initSocket = function() {
    if (socket) return;
    
    // Connect socket
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to real-time server');
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.innerHTML = '<span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span> Server Sync: Active';
            syncStatus.className = 'px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800 transition-colors';
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from real-time server');
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.innerHTML = '<span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span> Server Sync: Offline';
            syncStatus.className = 'px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wide border border-red-200 dark:border-red-800 transition-colors';
        }
    });

    // Handle Traffic State Updates
    socket.on('traffic-state', (state) => {
        // Save globally so the Driver map can read live signal data
        window.currentTrafficState = state;
        
        // --- DRIVER DASHBOARD UI UPDATES ---
        if (currentUser && currentUser.role === 'driver') {
             const timerText = document.getElementById('driverTimerText');
             const phaseText = document.getElementById('driverPhaseText');
             const redL = document.getElementById('driverRedLight');
             const yellowL = document.getElementById('driverYellowLight');
             const greenL = document.getElementById('driverGreenLight');
             const syncInd = document.getElementById('driverSyncIndicator');
             
             if (timerText) timerText.textContent = state.timeRemaining || '--';
             
             if (syncInd) {
                 syncInd.classList.remove('bg-red-500');
                 syncInd.classList.add('bg-green-500', 'animate-pulse');
             }
             
             // Assuming ambulance arrives on the NS axis for demo purposes
             if (phaseText && redL && yellowL && greenL) {
                  // Reset all
                  [redL, yellowL, greenL].forEach(l => {
                      l.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500', 'shadow-[0_0_15px_rgba(255,255,255,0.5)]');
                      l.classList.add('bg-red-500/20', 'bg-yellow-500/20', 'bg-green-500/20'); // dim state
                  });
                  
                  if (state.emergencyMode) {
                      phaseText.textContent = "EMERGENCY OVERRIDE";
                      phaseText.classList.add('text-brand-600', 'animate-pulse');
                      
                      // Active Light
                      const activeColor = state.signals.south; // ambulance direction
                      if (activeColor === 'green') {
                           greenL.classList.remove('bg-green-500/20');
                           greenL.classList.add('bg-green-500', 'shadow-[0_0_15px_rgba(34,197,94,0.8)]');
                      } else if (activeColor === 'red') {
                           redL.classList.remove('bg-red-500/20');
                           redL.classList.add('bg-red-500', 'shadow-[0_0_15px_rgba(239,68,68,0.8)]');
                      }
                  } else {
                      phaseText.textContent = state.currentPhase === 'NS' ? "NORTH-SOUTH" : "EAST-WEST";
                      phaseText.classList.remove('text-brand-600', 'animate-pulse');
                      
                      const activeColor = state.signals.south;
                      if (activeColor === 'green') {
                           greenL.classList.remove('bg-green-500/20');
                           greenL.classList.add('bg-green-500', 'shadow-[0_0_15px_rgba(34,197,94,0.8)]');
                      } else if (activeColor === 'yellow') {
                           yellowL.classList.remove('bg-yellow-500/20');
                           yellowL.classList.add('bg-yellow-500', 'shadow-[0_0_15px_rgba(234,179,8,0.8)]');
                      } else {
                           redL.classList.remove('bg-red-500/20');
                           redL.classList.add('bg-red-500', 'shadow-[0_0_15px_rgba(239,68,68,0.8)]');
                      }
                  }
             }
        }
        
        if (!currentUser || currentUser.role !== 'admin') return;
        
        updateTrafficVisuals(state);
    });
    
    // Handle specific density state independent of main tick
    socket.on('density-state', (density) => {
        if (!currentUser || currentUser.role !== 'admin') return;
        ['north', 'south', 'east', 'west'].forEach(dir => {
            const range = document.getElementById(`den-${dir}`);
            const label = document.getElementById(`label-den-${dir}`);
            if (range && label) {
                const valMap = { 'low': 1, 'medium': 2, 'high': 3 };
                range.value = valMap[density[dir]];
                label.textContent = density[dir].toUpperCase();
            }
        });
    });

    // Handle initial logs array
    socket.on('initial-logs', (logs) => {
        // Render for Admin
        if (currentUser && currentUser.role === 'admin') {
            const container = document.getElementById('logsContainer');
            if (container) {
                container.innerHTML = '';
                logs.slice().reverse().forEach(log => appendLog(log, container)); 
            }
            if (window.setupAdminMapSocket) window.setupAdminMapSocket(socket);
        }
        
        // Render for Driver
        if (currentUser && currentUser.role === 'driver') {
            const driverContainer = document.getElementById('driverAlertsBox');
            const emptyState = document.getElementById('alertsEmptyState');
            if (driverContainer && emptyState) {
                emptyState.classList.add('hidden');
                // Only show last 5 for driver so it doesn't overflow
                const recentLogs = logs.slice().reverse().slice(0, 5);
                recentLogs.forEach(log => {
                     const time = new Date(log.timestamp).toLocaleTimeString();
                     const color = log.type === 'warning' ? 'text-amber-400' : 'text-slate-400';
                     const icon = log.type === 'warning' ? '<i data-lucide="triangle-alert" class="w-3 h-3 inline pb-0.5"></i>' : '<i data-lucide="info" class="w-3 h-3 inline pb-0.5"></i>';
                     const div = document.createElement('div');
                     div.className = `py-1 border-b border-slate-800 ${color}`;
                     div.innerHTML = `<span class="opacity-50 inline-block w-16">[${time}]</span> ${icon} ${log.message}`;
                     driverContainer.appendChild(div);
                });
                if(window.lucide) window.lucide.createIcons();
            }
        }
    });

    // Handle new log entry
    socket.on('new-log', (log) => {
        // Update Admin
        if (currentUser && currentUser.role === 'admin') {
            const container = document.getElementById('logsContainer');
            if (container) appendLog(log, container, true);
            
            // Voice reading for admin logs - only major events
            if (log.type === 'warning' || log.message.includes('EMERGENCY')) {
                speak(log.message);
            }
        }
        
        // Update Driver
        if (currentUser && currentUser.role === 'driver') {
            const driverContainer = document.getElementById('driverAlertsBox');
            const emptyState = document.getElementById('alertsEmptyState');
            if (driverContainer && emptyState) {
                emptyState.classList.add('hidden');
                
                const time = new Date(log.timestamp).toLocaleTimeString();
                const color = log.type === 'warning' ? 'text-amber-400' : 'text-slate-400';
                const icon = log.type === 'warning' ? '<i data-lucide="triangle-alert" class="w-3 h-3 inline pb-0.5"></i>' : '<i data-lucide="info" class="w-3 h-3 inline pb-0.5"></i>';
                const div = document.createElement('div');
                div.className = `py-1 border-b border-slate-800 ${color}`;
                div.innerHTML = `<span class="opacity-50 inline-block w-16">[${time}]</span> ${icon} ${log.message}`;
                
                driverContainer.insertBefore(div, driverContainer.firstChild);
                if(window.lucide) window.lucide.createIcons();
            }
        }
    });

    // Handle Global Emergency Alert
    socket.on('emergency-alert', (data) => {
        const banner = document.getElementById('emergencyBanner');
        const centerVis = document.getElementById('centerEmergencyVisual');
        const centerIcon = document.getElementById('centerEmergencyIcon');
        const driverBanner = document.getElementById('driverEmergencyTopBanner');
        
        if (data.active) {
            if (banner) {
                banner.style.setProperty('display', 'flex', 'important');
            }
            
            if (centerVis) centerVis.classList.remove('opacity-0');
            if (centerIcon) centerIcon.classList.remove('opacity-0');
            if (driverBanner) {
                driverBanner.style.setProperty('display', 'flex', 'important');
            }
            
            // Global alert sound
            playSiren();
            if(!window.isEmergencyActive) speak(`EMERGENCY ALERT. Ambulance detected. Please clear the road. Green corridor active for ${data.direction} approach.`);
        } else {
            if (banner) {
                banner.style.setProperty('display', 'none', 'important');
            }
            
            if (centerVis) centerVis.classList.add('opacity-0');
            if (centerIcon) centerIcon.classList.add('opacity-0');
            if (driverBanner) {
                driverBanner.style.setProperty('display', 'none', 'important');
            }
            
            stopSiren();
            if(window.isEmergencyActive) speak("Emergency mode deactivated. Resuming normal traffic.");
        }
    });
};

function appendLog(log, container, animate = false) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const div = document.createElement('div');
    const colorClass = log.type === 'warning' ? 'text-red-400 bg-red-900/10' : 'text-slate-300';
    const borderClass = log.type === 'warning' ? 'log-warning' : 'log-info';
    
    div.className = `log-entry ${borderClass} ${colorClass} py-1 text-xs`;
    div.innerHTML = `<span class="opacity-50 inline-block w-20">[${time}]</span> ${log.message}`;
    
    container.insertBefore(div, container.firstChild);
}

function updateTrafficVisuals(state) {
    const phaseIndicator = document.getElementById('phaseIndicator');
    if (phaseIndicator) {
        phaseIndicator.textContent = `Phase: ${state.currentPhase === 'NS' ? 'North-South' : 'East-West'}`;
        if (state.emergencyMode) {
            phaseIndicator.textContent = `Phase: EMERGENCY OVERRIDE`;
            phaseIndicator.className = "text-sm font-bold text-red-500 animate-pulse";
        } else {
            phaseIndicator.className = "text-sm font-medium text-slate-500 dark:text-slate-400";
        }
    }

    // Update individual lights
    ['north', 'south', 'east', 'west'].forEach(dir => {
        const color = state.signals[dir];
        const container = document.getElementById(`sig-${dir}`);
        if (!container) return;
        
        // Reset all
        const lights = container.querySelectorAll('.light');
        lights.forEach(l => l.classList.remove('active'));
        
        // Set active
        const activePlug = container.querySelector(`.${color}`);
        if (activePlug) activePlug.classList.add('active');
    });
}
