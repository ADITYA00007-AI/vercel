'use strict';
// ============================================================
// PANEL NAVIGATION
// ============================================================
function switchPanel(id){
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const p=$('panel-'+id), n=$('nav-'+id);
    if(p) p.classList.add('active');
    if(n) n.classList.add('active');
    S.currentPanel=id;
}

// ============================================================
// FITMOVE UI SETUP
// ============================================================
function initFitMove(){
    document.querySelectorAll('.ex-btn').forEach(btn=>btn.addEventListener('click',()=>{
        document.querySelectorAll('.ex-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        S.fitExercise=btn.dataset.ex;
        S.fitState=S.fitExercise==='jacks'?'in':'up';
    }));

    document.querySelectorAll('.rep-btn').forEach(btn=>btn.addEventListener('click',()=>{
        document.querySelectorAll('.rep-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        S.fitTarget=parseInt(btn.dataset.reps);
        $('repTarget').textContent=S.fitTarget;
    }));

    $('startFitBtn').addEventListener('click',()=>{
        if(!S.cameraReady && !S.poseInitialized){
            openCameraModal();
        }
        S.fitActive=true; S.fitReps=0;
        S.fitStart=Date.now();
        S.fitState=S.fitExercise==='jacks'?'in':'up';
        $('repCount').textContent='0';
        $('repPbar').style.width='0%';
        $('sessionDone').style.display='none';
        $('startFitBtn').style.display='none';
        $('stopFitBtn').style.display='block';
        $('formHint').textContent='Exercise started! Follow the instructions above.';
        switchPanel('fitmove');
    });

    $('stopFitBtn').addEventListener('click',()=>{
        S.fitActive=false;
        $('startFitBtn').style.display='block';
        $('startFitBtn').innerHTML=`${SVG_ICONS.fitness} Start Exercise`;
        $('stopFitBtn').style.display='none';
        $('formHint').textContent='Exercise stopped.';
    });

    $('newSetBtn').addEventListener('click',()=>{
        $('sessionDone').style.display='none';
        S.fitReps=0;
        $('repCount').textContent='0';
        $('repPbar').style.width='0%';
        $('startFitBtn').style.display='block';
        $('startFitBtn').innerHTML=`${SVG_ICONS.fitness} Start Exercise`;
        $('stopFitBtn').style.display='none';
        $('phaseLabel').textContent='AWAITING START';
        const dot=$('phaseDot');
        if(dot) dot.className='phase-dot';
        $('formHint').textContent='Choose an exercise and click Start to begin optical verification.';
    });
}

// ============================================================
// STRETCH UI SETUP
// ============================================================
function initStretch(){
    renderStretchList();

    $('startStretchBtn').addEventListener('click',()=>{
        if(!S.cameraReady && !S.poseInitialized){
            openCameraModal();
        }
        S.stretchActive=true; S.stretchIdx=0; S.stretchStars=[];
        if(S.holdInterval){ clearInterval(S.holdInterval); S.holdInterval=null; }
        $('holdCount').style.display='none';
        $('holdBarWrap').style.display='none';
        $('sfbIcon').innerHTML=STRETCHES[0].icon;
        $('sfbTitle').textContent=STRETCHES[0].name;
        $('sfbDesc').textContent=STRETCHES[0].desc;
        $('startStretchBtn').style.display='none';
        renderStretchList();
        switchPanel('stretch');
    });

    $('goStretchBtn').addEventListener('click',()=>{
        $('stretchModal').style.display='none';
        if(!S.cameraReady && !S.poseInitialized){
            openCameraModal();
        }
        S.stretchActive=true; S.stretchIdx=0; S.stretchStars=[];
        $('sfbIcon').innerHTML=STRETCHES[0].icon;
        $('sfbTitle').textContent=STRETCHES[0].name;
        $('sfbDesc').textContent=STRETCHES[0].desc;
        $('startStretchBtn').style.display='none';
        renderStretchList();
        switchPanel('stretch');
    });

    $('skipStretchBtn').addEventListener('click',()=>{
        $('stretchModal').style.display='none';
        addPoints(-10,'Skipped stretch break','warning');
        showToast('warning','Stretch Skipped','-10 points. Prioritize mobility in your next session.');
    });
}

// ============================================================
// STREAK LOGIC
// ============================================================
function initStreak(){
    const today=new Date().toDateString();
    S.streakCountedToday = (S.lastDate===today);
    $('sidebarStreak').textContent=S.streak;
    $('dashStreak').textContent=S.streak;
}

function registerDailyEngagement(){
    if(S.streakCountedToday) return;
    S.streakCountedToday = true;
    const today=new Date().toDateString();
    const yesterday=new Date(Date.now()-86400000).toDateString();
    if(S.lastDate===yesterday) S.streak++;
    else S.streak=1;
    S.lastDate=today;
    localStorage.setItem('wa_date',today);
    localStorage.setItem('wa_str',S.streak);
    $('sidebarStreak').textContent=S.streak;
    $('dashStreak').textContent=S.streak;
    if(S.streak>1) showToast('fire','Streak Extended!',`${S.streak}-day streak active. Consistency verified.`);
}

// ============================================================
// LOADING SCREEN
// ============================================================
function animateLoading(){
    let progress=0;
    const bar=$('loadingBar');
    const tips=[
        "Calibration: Verify spinal alignment while initializing.",
        "Loading MediaPipe neural biomechanics framework...",
        "Calibrating real-time skeletal telemetry matrix...",
        "Synthesizing environmental lux sensory processing...",
        "Ergonomic tip: regular posture breaks help reduce neck and back discomfort."
    ];
    let ti=0;
    const iv=setInterval(()=>{
        progress+=Math.random()*12+4;
        if(progress>95) progress=95;
        bar.style.width=progress+'%';
        if(ti<tips.length&&progress>ti*20){
            $('loadingTip').textContent=tips[ti++];
        }
    },400);
    return { bar, iv };
}

// ============================================================
// GREETING
// ============================================================
function setGreeting(){
    const h=new Date().getHours();
    const tod = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
    const prof = AGE_PROFILES[S.ageProfile] || AGE_PROFILES.school;
    const greetingEl = $('greeting');
    if(greetingEl) greetingEl.textContent = `${tod}, ${prof.userGreeting}`;
    const subEl = $('subgreeting');
    if(subEl) subEl.textContent = prof.greetingDesc;
}

// ============================================================
// NAVIGATION SETUP
// ============================================================
function initNav(){
    document.querySelectorAll('.nav-item').forEach(btn=>{
        btn.addEventListener('click',()=>switchPanel(btn.dataset.panel));
    });
}

// ============================================================
// TIP ROTATOR
// ============================================================
function initTipRotator(){
    setInterval(()=>{
        S.tipIndex++;
        if(!S.poseResults){
            { const T=(typeof getTips==='function' && getTips())||TIPS; $('postureTip').textContent=T[S.tipIndex%T.length]; }
        }
    },9000);
}

// ============================================================
// ECO-SAVING SCREEN DIMMER (RESOURCE OPTIMIZATION)
// ============================================================
function checkEcoTimeout(){
    const isEcoEnabled = $('ecoModeToggle')?.checked;
    if(!isEcoEnabled || S.ecoOverlayActive || !S.cameraReady) return;
    
    // Dim the screen if no person has been detected for 6 seconds
    if(Date.now() - S.lastFaceDetectedTime > 6000){
        activateEcoMode();
    }
}

function activateEcoMode(){
    S.ecoOverlayActive = true;
    $('ecoOverlay').classList.add('active');
    
    // Pause Pomodoro study timer if running
    if(S.pomRunning){
        if(S.pomInterval) clearInterval(S.pomInterval);
        S.pomInterval = null;
        S.pomRunning = false;
        S.pomPausedByEco = true;
        $('timerBtn').textContent = 'Start';
        showToast('eco', 'Eco Pause', 'Timer suspended while user is absent.');
    }
    showToast('eco', 'Eco Mode Active', 'Display dimmed to conserve energy.');
}

function deactivateEcoMode(){
    S.ecoOverlayActive = false;
    $('ecoOverlay').classList.remove('active');
    S.lastFaceDetectedTime = Date.now(); // reset timer
    
    // Resume Pomodoro study timer if paused by Eco Mode
    if(S.pomPausedByEco){
        S.pomPausedByEco = false;
        S.pomRunning = true;
        $('timerBtn').textContent = 'Stop';
        if(S.pomInterval) clearInterval(S.pomInterval);
        S.pomInterval = setInterval(()=>{
            // Check for presence in timer loop too in case webcam feed is inactive
            if(Date.now() - S.lastFaceDetectedTime > 6000){
                checkEcoTimeout();
            }
            S.pomSec--;
            updateTimerDisplay();
            if(S.pomSec<=0){
                clearInterval(S.pomInterval);
                S.pomInterval = null;
                S.pomRunning = false;
                S.pomSec = 25*60;
                updateTimerDisplay();
                $('timerBtn').textContent = 'Start';
                $('stretchModal').style.display = 'flex';
                showToast('stretch','Break Time!','25 minutes completed — time for a mobility stretch!');
            }
        },1000);
        showToast('sun', 'Welcome Back!', 'Study timer resumed.');
    }
}

// ============================================================
// VOICE-CONTROLLED HANDS-FREE NAVIGATION (SpeechRecognition)
// ============================================================
function toggleVoiceControl(){
    if(!S.recognition){
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if(!SpeechRecognition){
            showToast('cross', 'Speech Recognition', 'Your browser does not support Speech Recognition.');
            return;
        }
        S.recognition = new SpeechRecognition();
        S.recognition.continuous = true;
        S.recognition.interimResults = false;
        S.recognition.lang = 'en-US';
        
        S.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.trim().toLowerCase();
            handleVoiceCommand(text);
        };
        
        S.recognition.onstart = () => {
            S.voiceActive = true;
            $('voiceToggleBtn').classList.add('active', 'listening');
            $('voiceLabel').textContent = 'Listening...';
            showToast('voice', 'Voice Control', 'Say commands like "posture", "dashboard", "goku"!');
        };
        
        S.recognition.onend = () => {
            $('voiceToggleBtn').classList.remove('listening');
            if(S.voiceActive){
                try { S.recognition.start(); } catch(e){}
            } else {
                $('voiceToggleBtn').classList.remove('active');
                $('voiceLabel').textContent = 'Voice OFF';
            }
        };
        
        S.recognition.onerror = (e) => {
            console.error('Speech error:', e.error);
            if(e.error === 'not-allowed'){
                showToast('cross', 'Microphone Denied', 'Microphone access is required for voice control.');
                S.voiceActive = false;
                S.recognition.stop();
            }
        };
    }
    
    if(S.voiceActive){
        S.voiceActive = false;
        S.recognition.stop();
        showToast('voice', 'Voice Control', 'Voice Commands deactivated.');
    } else {
        try {
            S.recognition.start();
        } catch(e){
            console.error(e);
        }
    }
}

function handleVoiceCommand(cmd){
    console.log('Voice Command received:', cmd);
    let action = '';
    
    if(cmd.includes('dashboard') || cmd.includes('home')){
        switchPanel('dashboard');
        action = 'Go to Dashboard';
    } else if(cmd.includes('posture') || cmd.includes('camera') || cmd.includes('avatar')){
        switchPanel('posture');
        action = 'Go to Posture Panel';
    } else if(cmd.includes('stretch') || cmd.includes('break')){
        switchPanel('stretch');
        action = 'Go to Stretch Breaks';
    } else if(cmd.includes('fitmove') || cmd.includes('workout') || cmd.includes('exercise')){
        switchPanel('fitmove');
        action = 'Go to FitMove Workout';
    } else if(cmd.includes('progress') || cmd.includes('report') || cmd.includes('achievement')){
        switchPanel('progress');
        action = 'Go to Progress';
    } else if(cmd.includes('squat')){
        switchPanel('fitmove');
        document.querySelectorAll('.ex-btn').forEach(b => b.classList.remove('active'));
        $('ex-squat').classList.add('active');
        S.fitExercise = 'squat';
        S.fitState = 'up';
        action = 'Select Squats';
    } else if(cmd.includes('pushup') || cmd.includes('push up')){
        switchPanel('fitmove');
        document.querySelectorAll('.ex-btn').forEach(b => b.classList.remove('active'));
        $('ex-pushup').classList.add('active');
        S.fitExercise = 'pushup';
        S.fitState = 'up';
        action = 'Select Pushups';
    } else if(cmd.includes('jumping jack') || cmd.includes('jack')){
        switchPanel('fitmove');
        document.querySelectorAll('.ex-btn').forEach(b => b.classList.remove('active'));
        $('ex-jacks').classList.add('active');
        S.fitExercise = 'jacks';
        S.fitState = 'in';
        action = 'Select Jumping Jacks';
    } else if(cmd.includes('arm raise') || cmd.includes('arms')){
        switchPanel('fitmove');
        document.querySelectorAll('.ex-btn').forEach(b => b.classList.remove('active'));
        $('ex-arms').classList.add('active');
        S.fitExercise = 'arms';
        S.fitState = 'up';
        action = 'Select Arm Raises';
    } else if(cmd.includes('goku')){
        $('avatarCharacterSelect').value = 'goku';
        const event = new Event('change');
        $('avatarCharacterSelect').dispatchEvent(event);
        action = 'Select Goku';
    } else if(cmd.includes('gojo')){
        $('avatarCharacterSelect').value = 'gojo';
        const event = new Event('change');
        $('avatarCharacterSelect').dispatchEvent(event);
        action = 'Select Gojo';
    } else if(cmd.includes('shinchan') || cmd.includes('shin chan')){
        $('avatarCharacterSelect').value = 'shinchan';
        const event = new Event('change');
        $('avatarCharacterSelect').dispatchEvent(event);
        action = 'Select Shinchan';
    } else if(cmd.includes('normal form') || cmd.includes('goku normal')){
        if($('avatarCharacterSelect').value === 'goku'){
            $('gokuFormSelect').value = 'normal';
            const event = new Event('change');
            $('gokuFormSelect').dispatchEvent(event);
            action = 'Goku Normal Form';
        }
    } else if(cmd.includes('ssj') || cmd.includes('super saiyan')){
        if($('avatarCharacterSelect').value === 'goku'){
            $('gokuFormSelect').value = 'ssj';
            const event = new Event('change');
            $('gokuFormSelect').dispatchEvent(event);
            action = 'Goku Super Saiyan';
        }
    } else if(cmd.includes('ultra instinct') || cmd.includes('ui')){
        if($('avatarCharacterSelect').value === 'goku'){
            $('gokuFormSelect').value = 'ui';
            const event = new Event('change');
            $('gokuFormSelect').dispatchEvent(event);
            action = 'Goku Ultra Instinct';
        }
    } else if(cmd.includes('start')){
        if(S.currentPanel === 'fitmove' && !S.fitActive){
            $('startFitBtn').click();
            action = 'Start Workout';
        } else if(S.currentPanel === 'stretch' && !S.stretchActive){
            $('startStretchBtn').click();
            action = 'Start Stretching';
        }
    } else if(cmd.includes('calculator') || cmd.includes('ergo') || cmd.includes('desk') || cmd.includes('chair')){
        switchPanel('ergocalc');
        action = 'Go to Ergo Calculator';
    } else if(cmd.includes('water') || cmd.includes('drink') || cmd.includes('hydrate')){
        logWater(250);
        action = 'Log 250ml Water';
    } else if(cmd.includes('stop') || cmd.includes('pause')){
        if(S.currentPanel === 'fitmove' && S.fitActive){
            $('stopFitBtn').click();
            action = 'Stop Workout';
        }
    } else if(cmd.includes('school') || cmd.includes('kid') || cmd.includes('child')){
        switchAgeProfile('school');
        action = 'Switched to School Mode';
    } else if(cmd.includes('college') || cmd.includes('exam') || cmd.includes('study mode')){
        switchAgeProfile('college');
        action = 'Switched to College Mode';
    } else if(cmd.includes('work') || cmd.includes('office') || cmd.includes('desk pro')){
        switchAgeProfile('work');
        action = 'Switched to Work Mode';
    } else if(cmd.includes('senior') || cmd.includes('gentle')){
        switchAgeProfile('senior');
        action = 'Switched to Senior Mode';
    } else if(cmd.includes('terminal') || cmd.includes('diagnostic') || cmd.includes('permission')){
        openTerminalModal();
        action = 'Opened Station Terminal';
    }
    
    if(action){
        showToast('voice', 'Voice Command', action + ' ("' + cmd + '")');
    }
}
