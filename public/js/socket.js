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

            // Update Civilian Mock UI (NEW)
            const civNormal = document.getElementById('civNormalState');
            const civAlert = document.getElementById('civAlertState');
            const civScreen = document.getElementById('civilianScreen');
            if (civNormal && civAlert && civScreen) {
                civNormal.classList.add('hidden');
                civAlert.classList.remove('hidden');
                civScreen.classList.replace('bg-slate-900', 'bg-red-900');
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

            // Reset Civilian Mock UI (NEW)
            const civNormal = document.getElementById('civNormalState');
            const civAlert = document.getElementById('civAlertState');
            const civScreen = document.getElementById('civilianScreen');
            if (civNormal && civAlert && civScreen) {
                civAlert.classList.add('hidden');
                civNormal.classList.remove('hidden');
                civScreen.classList.replace('bg-red-900', 'bg-slate-900');
            }
            
            stopSiren();
            if(window.isEmergencyActive) speak("Emergency mode deactivated. Resuming normal traffic.");
        }
    });

    // --- HOSPITAL NOTIFICATION EVENTS ---

    // 1. Hospital receives alert from driver
    socket.on('hospital-alert-received', (data) => {
        if (currentUser && currentUser.role === 'driver') {
            // If I am the driver who sent this, store the alertId for messaging
            if (data.driverId === currentUser.id) {
                window.currentAlertId = data.alertId;
            }
        }
        
        if (currentUser && currentUser.role === 'hospital') {
            const container = document.getElementById('incomingAlertsContainer');
            const noAlerts = document.getElementById('noAlertsMessage');
            
            if (noAlerts) noAlerts.classList.add('hidden');
            if (container) {
                const card = createHospitalAlertCard(data);
                container.insertBefore(card, container.firstChild);
                
                // Switch to this new alert if it's the only one or if it's critical
                const activeAlerts = container.querySelectorAll('.hospital-alert-card');
                if (activeAlerts.length === 1 || data.critical) {
                    updatePatientInfoPanel(data);
                }

                // Add to Past Records / History
                const history = document.getElementById('pastRecordsContainer');
                if (history) {
                    const row = document.createElement('div');
                    row.className = 'p-2 border-b border-gray-100 dark:border-slate-800 flex justify-between animate-in fade-in duration-500';
                    const time = new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    row.innerHTML = `<span class="font-medium">AMB-${data.alertId.substr(-4)} (${(data.problem || 'General').substr(0, 10)})</span><span class="text-slate-400">${time}</span>`;
                    history.insertBefore(row, history.firstChild);
                    if (history.children.length > 10) history.lastChild.remove();
                }

                // Play notification sound/voice
                if (window.speak) {
                    window.speak(`NEW EMERGENCY ALERT. Emergency ambulance incoming with ${data.critical ? 'CRITICAL' : 'Standard'} patient condition: ${data.problem}`);
                }
                if (window.lucide) window.lucide.createIcons();
            }
        }
    });

    // 2. Driver receives response from hospital
    socket.on('hospital-response-update', (data) => {
        if (currentUser && currentUser.role === 'driver') {
            const statusBox = document.getElementById('hospitalStatusResponse');
            const statusText = document.getElementById('hospResponseStatus');
            const statusMsg = document.getElementById('hospResponseMsg');
            const msgSection = document.getElementById('driverMessagingSection');

            if (statusBox && statusText && statusMsg) {
                statusBox.classList.remove('hidden', 'bg-slate-100', 'border-slate-300', 'bg-green-100', 'border-green-300', 'bg-amber-100', 'border-amber-300');
                
                if (data.status === 'READY') {
                    statusBox.classList.add('bg-green-100', 'border-green-300');
                    statusText.textContent = 'HOSPITAL READY';
                    statusText.className = 'text-xs font-black px-2 py-0.5 rounded bg-green-500 text-white';
                    statusMsg.textContent = `${data.hospitalName} is prepared for your arrival.`;
                    
                    if (msgSection) msgSection.classList.remove('hidden');
                    if (window.speak) window.speak("The hospital is ready and has sent instructions.");
                }
            }
        }
    });

    // 3. Ambulance location update for Hospital ETA
    socket.on('ambulance-location-update', (data) => {
        if (currentUser && currentUser.role === 'hospital') {
            const activeAlerts = document.querySelectorAll('.hospital-alert-card');
            
            // Assume the first one is the "closest" for the top banner for demo
            let closestAlert = null;
            let minDistance = Infinity;

            activeAlerts.forEach(card => {
                const alertId = card.dataset.alertId;
                // Use the specific hospital for this alert
                const targetHosp = data.hospitalId && window.hospitalData ? window.hospitalData[data.hospitalId] : (window.hospitalData ? Object.values(window.hospitalData)[0] : {lat: 28.62, lng: 77.215});
                
                const stats = updateTrackingInfo(card, data.lat, data.lng, targetHosp);
                
                if (stats && stats.dist < minDistance) {
                    minDistance = stats.dist;
                    closestAlert = card;
                    
                    // Update Top Banner for closest
                    const etaEl = document.getElementById('hospitalEtaTimer');
                    const ambIdEl = document.getElementById('closestAmbulanceId');
                    const severityEl = document.getElementById('closestAmbulanceSeverity');
                    
                    if (etaEl) etaEl.textContent = stats.eta + ":00";
                    if (ambIdEl) ambIdEl.textContent = "ID: " + (alertId || 'AMB-77');
                    if (severityEl) {
                        severityEl.textContent = card.dataset.isCritical === 'true' ? 'Critical' : 'Stable';
                        severityEl.className = card.dataset.isCritical === 'true' ? 
                            'text-[10px] font-black px-2 py-0.5 bg-white text-red-600 rounded-full animate-pulse uppercase' :
                            'text-[10px] font-black px-2 py-0.5 bg-white text-green-600 rounded-full uppercase';
                    }

                    // GPS Diagnostics Update
                    const diagPanel = document.getElementById('gpsDiagnosticsPanel');
                    const accEl = document.getElementById('gpsAccuracy');
                    const speedEl = document.getElementById('gpsSpeed');
                    
                    if (data.isRealGPS && diagPanel) {
                        diagPanel.classList.remove('hidden');
                        if (accEl) accEl.textContent = `${Math.round(data.accuracy || 0)}m`;
                        if (speedEl) speedEl.textContent = `${Math.round((data.speed || 0) * 3.6)} km/h`;
                    }

                    // Update Main Patient Info Panel
                    updatePatientInfoPanel(card.dataset.fullData);

                    // Geo-Fencing: Trigger Arrival State
                    if (stats.dist < 0.3 && !card.dataset.arrivedTriggered) {
                        card.dataset.arrivedTriggered = "true";
                        handleAmbulanceArrival(alertId, data.hospitalId);
                    }
                }

                // Update marker on Hospital Map
                if (window.hospitalAmbulanceMarker) {
                    window.hospitalAmbulanceMarker.setLatLng([data.lat, data.lng]);
                } else if (window.hMap) {
                    const ambIconHtml = `
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ambulance"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h2"/><path d="M19 18h2a2 2 0 0 0 2-2v-3.26a1 1 0 0 0-.2-.6l-3-4.5a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="18" r="2"/><circle cx="6" cy="18" r="2"/></svg>
                        </div>
                    `;
                    window.hospitalAmbulanceMarker = L.marker([data.lat, data.lng], {
                        icon: L.divIcon({ html: ambIconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
                    }).addTo(window.hMap);
                }
            });
        }
    });

    // 4. Messaging
    socket.on('hospital-message-received', (data) => {
        if (currentUser && currentUser.role === 'driver') {
            const msgBox = document.getElementById('driverMessages');
            if (msgBox) {
                msgBox.innerHTML = `<div class="text-[10px] text-brand-500 font-bold uppercase">${data.hospitalName}:</div>${data.message}`;
                msgBox.classList.add('animate-pulse');
                setTimeout(() => msgBox.classList.remove('animate-pulse'), 2000);
            }
        }
    });

    socket.on('driver-message-received', (data) => {
        if (currentUser && currentUser.role === 'hospital') {
            const card = document.querySelector(`.hospital-alert-card[data-alert-id="${data.alertId || ''}"]`) || document.querySelector('.hospital-alert-card');
            if (card) {
                const msgBox = card.querySelector('.alert-messages');
                if (msgBox) {
                    msgBox.innerHTML = `<div class="text-[10px] text-blue-500 font-bold uppercase">Driver ${data.driverName}:</div>${data.message}`;
                    msgBox.classList.remove('hidden');
                }
            }
        }
    });
};

function createHospitalAlertCard(data) {
    const div = document.createElement('div');
    const borderClass = data.critical ? 'border-red-500 shadow-red-500/10' : 'border-gray-100 dark:border-slate-800';
    div.className = `hospital-alert-card p-3 rounded-xl border bg-white dark:bg-slate-900/50 ${borderClass} shadow-sm animate-in slide-in-from-top duration-500 cursor-pointer hover:border-brand-500 transition-all`;
    div.dataset.alertId = data.alertId;
    div.dataset.isCritical = data.critical;
    div.dataset.fullData = JSON.stringify(data);
    
    const time = new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = `
        <div class="flex justify-between items-center">
            <div class="min-w-0">
                <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2 h-2 rounded-full ${data.critical ? 'bg-red-500 animate-pulse' : 'bg-green-500'}"></span>
                    <span class="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">AMB-${data.alertId.substr(-4)}</span>
                </div>
                <div class="text-[9px] font-medium text-slate-400 capitalize truncate">${data.problem}</div>
            </div>
            <div class="text-right shrink-0">
                <div class="text-[10px] font-bold text-brand-600 dist-val">-- km</div>
                <div class="text-[8px] text-slate-400 font-medium">${time}</div>
            </div>
        </div>
    `;

    div.addEventListener('click', () => updatePatientInfoPanel(data));
    return div;
}

function updatePatientInfoPanel(data) {
    if (typeof data === 'string') data = JSON.parse(data);
    if (!data) return;

    const el = (id) => document.getElementById(id);
    const vitals = data.vitals || { spo2: '98', hr: '72', age: '45', gender: 'M', type: 'General', severity: 'Stable', dept: 'Emergency' };
    
    // Auto-map problem keywords to categories if type not explicit
    let type = vitals.type || 'General';
    let dept = vitals.dept || 'Emergency';
    const p = (data.problem || '').toLowerCase();
    
    if (p.includes('heart') || p.includes('cardiac') || p.includes('chest')) { type = 'Cardiac'; dept = 'Cardiology'; }
    if (p.includes('accident') || p.includes('trauma') || p.includes('crash')) { type = 'Trauma'; dept = 'Trauma Care'; }
    if (p.includes('breath') || p.includes('lung')) { type = 'Respiratory'; dept = 'Pulmonary'; }
    
    if (el('patientInfoType')) el('patientInfoType').textContent = type;
    if (el('patientInfoDept')) el('patientInfoDept').textContent = dept;
    if (el('patientInfoSeverity')) {
        el('patientInfoSeverity').textContent = data.critical ? 'CRITICAL' : 'STABLE';
        el('patientInfoSeverity').className = `text-sm font-black uppercase tracking-wide ${data.critical ? 'text-red-500 animate-pulse' : 'text-green-500'}`;
    }
    if (el('patientInfoAge')) el('patientInfoAge').textContent = 'Age: ' + (vitals.age || '42');
    if (el('patientInfoGender')) el('patientInfoGender').textContent = 'Gender: ' + (vitals.gender || 'M');
    if (el('vitalsHR_Hosp')) el('vitalsHR_Hosp').textContent = vitals.hr || '82';
    if (el('vitalsSPO2_Hosp')) el('vitalsSPO2_Hosp').textContent = (vitals.spo2 || '96') + '%';
    
    // Setup the Mark Ready button for this specific alert
    const readyBtn = el('markReadyBtn');
    if (readyBtn) {
        readyBtn.classList.remove('hidden');
        // Clear old listeners by cloning
        const newBtn = readyBtn.cloneNode(true);
        readyBtn.parentNode.replaceChild(newBtn, readyBtn);
        newBtn.addEventListener('click', () => {
            acknowledgeAlert(data.alertId, 'READY', data.hospitalName);
            newBtn.classList.add('opacity-50', 'pointer-events-none');
            newBtn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Acknowledged';
            lucide.createIcons();
        });
    }

    // Update chat snippet if needed
    const snippet = el('hospChatSnippet');
    const snippetMsg = el('hospChatSnippetMsg');
    if (snippet && snippetMsg) {
        snippet.classList.remove('hidden');
        snippetMsg.textContent = `"${data.problem}"`;
    }
}

function updateTrackingInfo(card, ambLat, ambLng, hospCoords) {
    const distEl = card.querySelector('.dist-val');
    if (!distEl) return null;
    
    // Simple Euclidean distance for simulation demo (lat/lng to KM approx)
    const dist = Math.sqrt(Math.pow(ambLat - hospCoords.lat, 2) + Math.pow(ambLng - hospCoords.lng, 2)) * 111; 
    const eta = Math.round(dist * 1.5); // Assume 40km/h avg
    
    distEl.textContent = `${dist.toFixed(1)} km`;
    
    if (dist < 0.2) {
        distEl.innerHTML = '<span class="text-red-500 animate-pulse">ARRIVING</span>';
    }

    return { dist, eta };
}

function handleAmbulanceArrival(alertId, hospitalId) {
    console.log(`Ambulance ${alertId} has entered geo-fence for hospital ${hospitalId}`);
    
    const internalDeptAlert = document.querySelector('.bg-orange-50 p');
    if (internalDeptAlert) {
        internalDeptAlert.innerHTML = `<span class="text-red-600 font-black animate-pulse">EMERGENCY: AMB-${alertId.substr(-4)} AT GATE</span>`;
    }
    
    if (window.speak) {
        window.speak(`Priority Warning. Ambulance ${alertId.substr(-4)} has arrived at the emergency bay. Prepare all teams.`);
    }
}

window.sendHospitalMsg = function(alertId, hospitalName) {
    const card = document.querySelector(`.hospital-alert-card[data-alert-id="${alertId}"]`);
    const input = card ? card.querySelector('.hosp-msg-input') : null;
    const msg = input ? input.value : null;

    if (!msg || !msg.trim()) return;
    
    if (socket) {
        socket.emit('hospital-to-driver-message', {
            alertId,
            hospitalName,
            message: msg
        });
        if (input) {
            input.value = '';
            input.placeholder = 'Sent!';
            setTimeout(() => input.placeholder = 'Instructions...', 2000);
        }
    }
};

window.acknowledgeAlert = function(alertId, status, hospitalName) {
    if (socket) {
        socket.emit('hospital-acknowledgment', {
            alertId,
            status,
            hospitalName,
            timestamp: new Date().toISOString()
        });
        console.log(`Sent acknowledgment for ${alertId} as ${status}`);
    }
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

window.updateTrafficVisuals = function(state) {
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
