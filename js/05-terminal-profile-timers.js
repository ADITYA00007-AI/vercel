'use strict';
// ============================================================
// TERMINAL DIAGNOSTICS & SYSTEM SENSORS
// ============================================================
function logTerminal(msg, type = ''){
    const consoleEl = $('termConsole');
    if(!consoleEl) return;
    const line = document.createElement('div');
    line.className = 'term-line ' + type;
    line.textContent = msg;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function updateTerminalUI(){
    const camDot = $('termStatusDot');
    if(camDot){
        if(S.cameraReady) camDot.classList.add('online');
        else camDot.classList.remove('online');
    }

    const setBadge = (id, text, isOnline, isPending = false) => {
        const b = $(id);
        if(!b) return;
        b.textContent = text;
        b.className = 'ts-badge ' + (isOnline ? 'online active' : isPending ? 'pending' : '');
    };

    setBadge('permCamBadge', S.cameraReady ? 'ONLINE' : 'REQUIRED', S.cameraReady);
    setBadge('termCamStatus', S.cameraReady ? 'ONLINE (30 FPS)' : 'OFFLINE', S.cameraReady);

    const micOnline = S.voiceActive;
    setBadge('permMicBadge', micOnline ? 'ONLINE' : 'RECOMMENDED', micOnline);
    setBadge('termMicStatus', micOnline ? 'LISTENING' : 'OFFLINE', micOnline);

    const notifGranted = ('Notification' in window) && Notification.permission === 'granted';
    setBadge('permNotifBadge', notifGranted ? 'ACTIVE' : 'OPTIONAL', notifGranted);
    setBadge('termNotifStatus', notifGranted ? 'ENABLED' : 'PROMPT', notifGranted);

    setBadge('termAudioStatus', S.permissions.audio ? 'READY' : 'STANDBY', S.permissions.audio);
}

function openTerminalModal(){
    const modal = $('terminalModal');
    if(modal) {
        modal.style.display = 'flex';
        updateTerminalUI();
    }
}

function closeTerminalModal(){
    const modal = $('terminalModal');
    if(modal) modal.style.display = 'none';
}

function openCameraModal(){
    if (S.cameraReady || S.poseInitialized) {
        showToast('info','Camera Active','The camera tracking is already enabled.');
        return;
    }
    if(typeof needsConsent==='function' && needsConsent()){ showConsent(); return; }
    const modal = $('cameraPrivacyModal');
    if(modal) {
        modal.style.display = 'flex';
        updateTerminalUI();
    }
}

function closeCameraModal(){
    const modal = $('cameraPrivacyModal');
    if(modal) modal.style.display = 'none';
}

// Master Authorization: Requests Camera + Microphone simultaneously in a single browser dialog,
// asks for desktop notifications, and initializes audio context for zero-delay operations.
async function requestAllTerminalPermissions(){
    if (S.cameraReady && S.poseInitialized) {
        showToast('info','Sensors Active','Station hardware telemetry is already active.');
        closeCameraModal();
        closeTerminalModal();
        return;
    }

    logTerminal('> SYS_EXEC: Authorizing all station sensors at once...');
    unlockAudioContext();

    // 1. Request desktop notifications
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
            logTerminal(`[NOTIF] Desktop alerts: ${perm.toUpperCase()}`, perm === 'granted' ? 'success' : 'warn');
            updateTerminalUI();
        }).catch(() => {});
    }

    // 2. Request Camera AND Microphone simultaneously in ONE native browser prompt
    try {
        logTerminal('> SYS_CALL: Requesting Camera (Optical 640x480) + Microphone (Voice)...');
        showToast('camera','Station Authorization','Please click "Allow" on the browser prompt for Camera & Microphone.');

        const stream = await navigator.mediaDevices.getUserMedia({
            video: FAST_VIDEO_CONSTRAINTS,
            audio: { echoCancellation: true, noiseSuppression: true }
        });

        logTerminal('✓ HARDWARE ONLINE: Optical sensor & microphone stream verified.', 'success');
        S.permissions.camera = true;
        S.permissions.mic = true;

        const video = $('input_video');
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(() => {});
            initPose();
        };

        // Start hands-free speech recognition without requiring a second prompt
        if(!S.voiceActive){
            toggleVoiceControl(true);
        }

        closeCameraModal();
        closeTerminalModal();
        updateTerminalUI();

        showToast('check','Station Fully Online!','Camera (Zero-Buffer), Microphone & Biofeedback authorized.');
        addActivity('Station Terminal fully authorized', '15 pts');
        addPoints(15, 'Station Hardware Authorization');

    } catch(err) {
        console.warn('Combined camera/mic prompt error or partial denial:', err);
        logTerminal(`! Audio/Video combined warning: ${err.name}. Attempting camera-only fallback...`, 'warn');

        // Fallback: If microphone was absent or user rejected mic, activate camera alone
        try {
            const vidStream = await navigator.mediaDevices.getUserMedia({
                video: FAST_VIDEO_CONSTRAINTS,
                audio: false
            });
            S.permissions.camera = true;
            logTerminal('✓ Camera sensor online (Zero-buffer fast tracking).', 'success');
            const video = $('input_video');
            video.srcObject = vidStream;
            video.onloadedmetadata = () => {
                video.play().catch(() => {});
                initPose();
            };
            closeCameraModal();
            closeTerminalModal();
            updateTerminalUI();
            showToast('check','Camera Connected!','Zero-buffer camera telemetry active (Microphone was bypassed).');
        } catch(err2) {
            logTerminal(`✗ Camera sensor access denied: ${err2.message}`, 'warn');
            showToast('cross','Sensor Denied!','Please click the site permissions icon in the browser address bar to allow Camera.');
            updateTerminalUI();
        }
    }
}

// Standalone camera request with fast resolution constraints
function requestCameraPermission(){
    if (S.cameraReady || S.poseInitialized) {
        showToast('info','Camera Active','The camera tracking is already enabled.');
        closeCameraModal();
        return;
    }
    unlockAudioContext();
    showToast('camera','Camera Request','Please authorize camera permission in the browser prompt.');
    navigator.mediaDevices.getUserMedia({ video: FAST_VIDEO_CONSTRAINTS, audio: false })
        .then(stream => {
            S.permissions.camera = true;
            logTerminal('✓ Camera sensor online (640x480 @ 30 FPS).', 'success');
            const video = $('input_video');
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play().catch(() => {});
                initPose();
            };
            closeCameraModal();
            closeTerminalModal();
            updateTerminalUI();
        })
        .catch(err => {
            showToast('cross','Camera Denied!','Please click the site permissions icon in the address bar to allow Camera.');
            logTerminal(`✗ Camera permission error: ${err.message}`, 'warn');
            console.error('Camera permission request error:', err);
            updateTerminalUI();
        });
}

function initPose(){
    if (S.poseInitialized) return;
    S.poseInitialized = true;
    const video = $('input_video');
    poseInstance = new Pose({
        locateFile: (f) => `${window.__POSE_BASE || 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/'}${f}`
    });
    poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    poseInstance.onResults(onPoseResults);

    // Fast zero-buffer frame loop:
    // Uses an execution latch and 30 FPS interval throttling to guarantee
    // that frames never backlog or buffer. This eliminates camera latency completely!
    let rafId = null;
    let poseActive = true;
    let isProcessingFrame = false;
    let lastFrameTime = 0;
    const MIN_FRAME_INTERVAL = 1000 / 30; // 30 FPS cap (~33.3ms)

    async function sendFrame(timestamp) {
        if (!poseActive) return;

        if (timestamp - lastFrameTime >= MIN_FRAME_INTERVAL) {
            if (!isProcessingFrame && video.readyState >= 2 && video.videoWidth > 0) {
                isProcessingFrame = true;
                lastFrameTime = timestamp;
                try {
                    await poseInstance.send({ image: video });
                } catch (e) {
                    console.warn('Pose send error:', e);
                } finally {
                    isProcessingFrame = false;
                }
            }
        }
        rafId = requestAnimationFrame(sendFrame);
    }

    // Store stop function on mediaCamera-like object for compatibility with stopCamera()
    mediaCamera = {
        stop: () => {
            poseActive = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
            // Stop all tracks on the video element's stream
            const stream = video.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
        }
    };

    sendFrame(performance.now());
}


// Fully stops the webcam stream and resets camera UI back to "off" state.
function stopCamera(){
    if (mediaCamera) { mediaCamera.stop(); mediaCamera = null; }
    // FIX 3: Destroy the MediaPipe Pose WASM instance to free GPU/CPU resources
    if (poseInstance) { try { poseInstance.close(); } catch(e){} poseInstance = null; }
    if (S.holdInterval) { clearInterval(S.holdInterval); S.holdInterval = null; }
    S.cameraReady = false;
    S.poseInitialized = false;
    S.poseResults = null;
    if (typeof resetCalibration === 'function') resetCalibration();
    S.fitActive = false;
    S.stretchActive = false;

    const dot = $('camDot');
    if (dot) dot.className = 'cam-dot';
    const txt = $('camStatusText');
    if (txt) txt.textContent = 'Camera Offline';
    const stopBtn=$('camStopBtn');
    if(stopBtn) stopBtn.style.display='none';
    
    // Restore all camera placeholders
    $('posturePlaceholder')?.style.setProperty('display', 'flex');
    $('stretchPlaceholder')?.style.setProperty('display', 'flex');
    $('fitmovePlaceholder')?.style.setProperty('display', 'flex');
    $('dashCamPrompt')?.style.setProperty('display', 'block');

    showToast('camera','Camera Stopped','Sensor feed has been deactivated.');
    addActivity('Camera feed disconnected', '0 pts');
}

// ============================================================
// AGE-BASED ERGONOMIC PROFILE ENGINE
// ============================================================
function openAgeModal(){
    const modal = $('ageProfileModal');
    if(modal) {
        modal.style.display = 'flex';
        syncAgeProfileUI();
    }
}

function closeAgeModal(){
    const modal = $('ageProfileModal');
    if(modal) modal.style.display = 'none';
}

function syncAgeProfileUI(){
    const prof = AGE_PROFILES[S.ageProfile] || AGE_PROFILES.school;

    // Header Pill
    const pillIcon = $('agePillIcon');
    if(pillIcon) pillIcon.textContent = prof.icon;
    const pillName = $('agePillName');
    if(pillName) pillName.textContent = prof.label;
    const mobPill = $('mobileAgePill');
    if(mobPill) mobPill.textContent = `${prof.icon} ${prof.label}`;

    // Dashboard Banner
    const ambIcon = $('ambIcon');
    if(ambIcon) ambIcon.textContent = prof.icon;
    const ambBadge = $('ambBadge');
    if(ambBadge) ambBadge.textContent = `AGE MODE: ${prof.label.toUpperCase()} (${prof.sublabel})`;
    const ambTitle = $('ambTitle');
    if(ambTitle) ambTitle.textContent = prof.greetingTitle;
    const ambDesc = $('ambDesc');
    if(ambDesc) ambDesc.textContent = prof.greetingDesc;

    // Modal Cards Active State
    document.querySelectorAll('.age-option-card').forEach(card => {
        const id = card.dataset.age;
        const btn = card.querySelector('.age-select-btn');
        if(id === S.ageProfile){
            card.classList.add('active');
            if(btn) { btn.textContent = 'Active Mode'; btn.classList.add('active'); }
        } else {
            card.classList.remove('active');
            if(btn) { btn.textContent = `Select ${AGE_PROFILES[id]?.label || 'Mode'}`; btn.classList.remove('active'); }
        }
    });

    setGreeting();
}

function switchAgeProfile(profileId, showToastAlert = true){
    if(!AGE_PROFILES[profileId]) return;
    S.ageProfile = profileId;
    localStorage.setItem('wa_age_profile', profileId);

    const prof = AGE_PROFILES[profileId];

    // 1. Update Hydration Target
    S.waterGoal = prof.waterGoal;
    updateWaterUI();

    // 2. Update Focus Cycle (if timer is not running)
    if(!S.pomRunning){
        S.pomSec = prof.pomMinutes * 60;
        updateTimerDisplay();
    }

    // 3. Update Stretches & re-render
    STRETCHES = prof.stretches;
    S.stretchIdx = 0;
    S.stretchStars = [];
    if($('stretchList')) renderStretchList();

    // 4. Update Tips
    TIPS = prof.tips;
    S.tipIndex = 0;
    if($('postureTip') && TIPS.length > 0) $('postureTip').textContent = TIPS[0];

    // 5. Update Avatar default if user hasn't explicitly locked it
    if(prof.avatarDefault && $('avatarCharacterSelect')){
        $('avatarCharacterSelect').value = prof.avatarDefault;
        const ev = new Event('change');
        $('avatarCharacterSelect').dispatchEvent(ev);
    }

    // 6. Update ErgoCalc preset if default
    if(prof.ergoPreset && S.ergoUnit === 'cm'){
        const hInput = $('userHeight');
        if(hInput){
            hInput.value = prof.ergoPreset.height;
            S.ergoHeight = prof.ergoPreset.height;
            localStorage.setItem('wa_ergo_height', S.ergoHeight);
            if($('calcSetup')) $('calcSetup').value = prof.ergoPreset.setup;
            S.ergoSetup = prof.ergoPreset.setup;
            localStorage.setItem('wa_ergo_setup', S.ergoSetup);
            updateErgoCalc();
        }
    }

    syncAgeProfileUI();
    closeAgeModal();
    logTerminal(`> AGE_ENGINE: Switched to [${prof.label}] mode. Biomechanics calibrated.`, 'info');

    if(showToastAlert){
        showToast('star', `${prof.label} Activated!`, `Ergonomics & study rhythms calibrated for ${prof.sublabel}.`);
        addActivity(`Switched to ${prof.label} profile`, '5 pts');
        addPoints(5, `${prof.label} Mode Calibration`);
    }
}

// ============================================================
// POMODORO TIMER
// ============================================================
function updateTimerDisplay(){
    const m=String(Math.floor(S.pomSec/60)).padStart(2,'0');
    const s=String(S.pomSec%60).padStart(2,'0');
    $('timerValue').textContent=`${m}:${s}`;
}

function initPomodoro(){
    $('timerBtn').addEventListener('click',()=>{
        if(S.pomRunning){
            if(S.pomInterval) clearInterval(S.pomInterval);
            S.pomInterval=null;
            S.pomRunning=false;
            S.pomPausedByEco=false;
            S.pomSec=25*60;
            updateTimerDisplay();
            $('timerBtn').textContent='Start';
        } else {
            if(S.pomInterval) clearInterval(S.pomInterval);
            S.pomRunning=true;
            S.pomPausedByEco=false;
            $('timerBtn').textContent='Stop';
            S.pomInterval=setInterval(()=>{
                // Eco mode check when pomodoro is running and camera is offline / no frames
                if(Date.now() - S.lastFaceDetectedTime > 6000){
                    checkEcoTimeout();
                }
                S.pomSec--;
                updateTimerDisplay();
                if(S.pomSec<=0){
                    clearInterval(S.pomInterval);
                    S.pomInterval=null;
                    S.pomRunning=false;
                    S.pomSec=25*60;
                    updateTimerDisplay();
                    $('timerBtn').textContent='Start';
                    $('stretchModal').style.display='flex';
                    showToast('stretch','Break Time!','25 minutes completed — time for a mobility stretch!');
                }
            },1000);
        }
    });
}

// ============================================================
// SMART HYDRATION & WATER DRINKING REMINDER
// ============================================================
function playWaterSound(){
    try {
        const ctx = getAudioContext();
        if(!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
    } catch(e){}
}

function updateWaterUI(){
    // Check if new day
    const today = new Date().toDateString();
    const lastWaterDate = localStorage.getItem('wa_water_date');
    if(lastWaterDate !== today){
        S.waterMl = 0;
        localStorage.setItem('wa_water_ml', '0');
        localStorage.setItem('wa_water_date', today);
    }

    const pct = Math.min(100, Math.round((S.waterMl / S.waterGoal) * 100));
    
    // Header widget
    const badge = $('waterIntakeBadge');
    if(badge) badge.textContent = `${S.waterMl}/${S.waterGoal}ml`;
    const headerBar = $('waterHeaderBar');
    if(headerBar) headerBar.style.width = pct + '%';
    
    // Dashboard stat
    const dashW = $('dashWater');
    if(dashW) dashW.innerHTML = `${S.waterMl}<span style="font-size:11px;font-weight:500;color:var(--tx2);">/${S.waterGoal}ml</span>`;
}

function updateWaterTimerDisplay(){
    const m = String(Math.floor(S.waterTimerSec / 60)).padStart(2, '0');
    const s = String(S.waterTimerSec % 60).padStart(2, '0');
    const el = $('waterTimerVal');
    if(el) el.textContent = `${m}:${s}`;
}

function logWater(amount = 250){
    S.waterMl = Math.min(S.waterGoal + 1500, S.waterMl + amount);
    localStorage.setItem('wa_water_ml', S.waterMl);
    localStorage.setItem('wa_water_date', new Date().toDateString());
    
    S.waterPoints += 15;
    const bdW = $('bdWater');
    if(bdW) bdW.textContent = S.waterPoints;
    
    playWaterSound();
    updateWaterUI();
    addPoints(15, `+${amount}ml Water Logged`, 'water');
    addActivity(`Logged ${amount}ml water (${S.waterMl}/${S.waterGoal}ml)`, '+15 pts');
    
    if(S.waterMl === S.waterGoal || S.waterMl === S.waterGoal + 250){
        showToast('award', 'Hydration Goal Achieved!', `You reached ${S.waterGoal}ml of water intake today.`);
    } else {
        showToast('water', 'Hydration Logged', `+${amount}ml recorded (${S.waterMl}/${S.waterGoal}ml). Well done!`);
    }
}

function triggerWaterAlert(){
    playWaterSound();
    showToast('water', 'Hydration Interval', '45 minutes elapsed. Hydrate with clean water for optimal cognitive focus.');
    addActivity('Hydration interval reminder', '0 pts');
}

function initWaterReminder(){
    updateWaterUI();
    updateWaterTimerDisplay();

    // Log button in header (explicit button click only)
    $('waterLogBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        logWater(250);
    });

    // Start 1-second interval countdown for water drinking
    if(S.waterInterval) clearInterval(S.waterInterval);
    S.waterInterval = setInterval(() => {
        S.waterTimerSec--;
        updateWaterTimerDisplay();
        if(S.waterTimerSec <= 0){
            S.waterTimerSec = 45 * 60; // Reset to 45 mins
            updateWaterTimerDisplay();
            triggerWaterAlert();
        }
    }, 1000);
}
