'use strict';
// ============================================================
// ERGONOMIC CARTOON AVATARS — Real Image Rendering
// ============================================================

// Speech lines per character + posture state
const AVATAR_LINES = {
    goku: {
        good: [
            "Posture power level is OVER 9000! Keep it up!",
            "Your spine is aligned like a true Saiyan — amazing!",
            "This is the Ultra Instinct of sitting straight!"
        ],
        bad: [
            "Kakarot, your posture is dropping! Straighten UP!",
            "Slouching won't help you go Super Saiyan! Sit straight!",
            "Even Vegeta sits better than this. SPINE STRAIGHT!"
        ]
    },
    gojo: {
        good: [
            "Domain Expansion: Infinite Alignment! Flawless posture!",
            "Hmph. Six Eyes approved. You're the strongest sitter.",
            "Don't worry, with this posture — you're already the best!"
        ],
        bad: [
            "My Six Eyes can see every degree of your slouch. Fix it!",
            "Even Sukuna would frown at this posture. Sit UP!",
            "A little straightening and we'd be on the same level. Come on."
        ]
    },
    student: {
        good: [
            "Spine tall, shoulders soft — study mode unlocked!",
            "Great sitting! Your back says thank you.",
            "Neat posture, neat mind. Keep going!"
        ],
        bad: [
            "Oops, my hair and my back are both a mess! Sit up!",
            "Slouch alert! Roll your shoulders back.",
            "Take a breath, lift your chest, reset your posture."
        ]
    },
    shinchan: {
        good: [
            "Hehehe! I'm sitting straight — Misae won't hit me today!",
            "Action Kamen pose! Upright and ready for Chocobi!",
            "Look Misae, I have perfect posture! Can I get extra snacks?"
        ],
        bad: [
            "Oh no! Misae is coming with her knuckle-bump!",
            "Ouch! My back is bending like a wriggly squiggle!",
            "If I keep slouching, even Shiro the dog sits better than me!"
        ]
    }
};

// Map every character + form + posture state to its video file
const AVATAR_VIDEOS = {
    goku: {
        normal:  { good: 'assets/videos/goku-normal-good.mp4',   bad: 'assets/videos/goku-exhausted-bad.mp4' },
        ssj:     { good: 'assets/videos/goku-ssj-good.mp4',      bad: 'assets/videos/goku-exhausted-bad.mp4' },
        ui:      { good: 'assets/videos/goku-ui-good.mp4',       bad: 'assets/videos/goku-exhausted-bad.mp4' },
    },
    gojo: {
        default: { good: 'assets/videos/gojo-good.mp4',          bad: 'assets/videos/gojo-bad.mp4' },
    },
    shinchan: {
        default: { good: 'assets/videos/shinchan-good.mp4',      bad: 'assets/videos/shinchan-bad.mp4' },
    }
};

// Track last rendered state so we don't rebuild the DOM every posture frame
let _lastAvatarKey = '';

function triggerAvatarUpdate(){
    const char   = $('avatarCharacterSelect')?.value || 'goku';
    const form   = $('gokuFormSelect')?.value        || 'normal';
    const isGood = S.postureScore >= 75 || !S.cameraReady;
    const state  = isGood ? 'good' : 'bad';

    // Pick speech line and update speech bubble text without resetting video
    const lines = (typeof getAvatarLines==='function' && getAvatarLines(char,state)) || AVATAR_LINES[char]?.[state] || AVATAR_LINES.goku.good;
    const speechText = lines[Math.floor(Date.now() / 15000) % lines.length];
    const speechEl = $('avatarSpeechText');
    if(speechEl && speechEl.textContent !== `"${speechText}"`) {
        speechEl.textContent = `"${speechText}"`;
    }

    // Unique key — only re-render if character, form, or posture state actually changed
    const key = `${char}-${form}-${state}-${$('studentStyleSelect')?.value || ''}`;
    if(key === _lastAvatarKey) return;   // nothing changed → let the video keep playing
    _lastAvatarKey = key;

    // Resolve the video/image source
    const formKey = char === 'goku' ? form : 'default';
    let src = AVATAR_VIDEOS[char]?.[formKey]?.[state] || '';
    if(char === 'student'){
        const style = $('studentStyleSelect')?.value || 'neat';
        src = !isGood ? 'assets/avatars/student-messy-hair.png'
            : style === 'glasses' ? 'assets/avatars/student-glasses.png'
            : style === 'kimono'  ? 'assets/avatars/student-kimono.png'
            : 'assets/avatars/student-neat-hair.png';
    }
    const isVideo = src.endsWith('.mp4');

    // CSS classes for styling hooks
    const postureClass = isGood ? 'posture-good' : 'posture-bad';
    const formClass    = char === 'goku' ? `form-${form}` : '';
    const charClass    = `char-${char}`;
    const auraHTML     = char === 'goku' ? '<div class="aura-ring"></div>' : '';

    const displayBox = $('avatarDisplayBox');
    if(!displayBox) return;

    if(isVideo){
        // Build a <video> element — autoplay, loop, muted, natural speed (no playbackRate override)
        displayBox.innerHTML = `
            <div class="avatar-img-wrap ${charClass} ${formClass} ${postureClass}">
                ${auraHTML}
                <video
                    autoplay
                    loop
                    muted
                    playsinline
                    preload="auto"
                    poster="${src.replace('.mp4','.jpg')}"
                    style="max-height:220px;width:100%;object-fit:contain;border-radius:14px;display:block;"
                    src="${src}"
                ></video>
            </div>`;
        // Force play (some browsers need an explicit call after innerHTML injection)
        const vid = displayBox.querySelector('video');
        if(vid) vid.play().catch(()=>{});
    } else {
        // Fallback: static image (used for Gojo good-posture still)
        displayBox.innerHTML = `
            <div class="avatar-img-wrap ${charClass} ${formClass} ${postureClass}">
                ${auraHTML}
                <img src="${src}" alt="${char}" draggable="false"
                     style="max-height:220px;width:100%;object-fit:contain;border-radius:14px;display:block;">
            </div>`;
    }
}


// ============================================================
// MAIN INIT
// ============================================================
window.addEventListener('DOMContentLoaded',()=>{
    // Cache canvases
    CANVASES.posture=$('posture_canvas');
    CANVASES.stretch=$('stretch_canvas');
    CANVASES.fitmove=$('fitmove_canvas');
    CTXS.posture=CANVASES.posture?.getContext('2d', { willReadFrequently: true });
    CTXS.stretch=CANVASES.stretch?.getContext('2d', { willReadFrequently: true });
    CTXS.fitmove=CANVASES.fitmove?.getContext('2d', { willReadFrequently: true });

    // Loading animation
    const load=animateLoading();

    // Setup UI
    setGreeting();
    try{ initStreak(); }catch(e){ console.error('initStreak failed',e); }
    try{ initNav(); }catch(e){ console.error('initNav failed',e); }
    try{ initPomodoro(); }catch(e){ console.error('initPomodoro failed',e); }
    try{ initWaterReminder(); }catch(e){ console.error('initWaterReminder failed',e); }
    try{ initErgoCalc(); }catch(e){ console.error('initErgoCalc failed',e); }
    try{ initFitMove(); }catch(e){ console.error('initFitMove failed',e); }
    try{ initStretch(); }catch(e){ console.error('initStretch failed',e); }
    try{ initCharts(); }catch(e){ console.error('initCharts failed',e); }
    updateTree();
    checkAchievements();
    syncPointsUI();
    $('dashReps').textContent=S.totalReps;

    // Tip rotator
    try{ initTipRotator(); }catch(e){ console.error('initTipRotator failed',e); }

    // Initialize Anime Avatar
    triggerAvatarUpdate();
    
    // Avatar selection handlers — reset key so the video always reloads on manual change
    $('avatarCharacterSelect')?.addEventListener('change', (e) => {
        const char = e.target.value;
        const gG = $('gokuFormGroup');
        if (gG) gG.style.display = char === 'goku' ? 'flex' : 'none';
        const sG = $('studentStyleGroup');
        if (sG) sG.style.display = char === 'student' ? 'flex' : 'none';
        _lastAvatarKey = '';   // force a fresh video load
        triggerAvatarUpdate();
    });
    $('studentStyleSelect')?.addEventListener('change', () => { _lastAvatarKey = ''; triggerAvatarUpdate(); });
    $('gokuFormSelect')?.addEventListener('change', () => {
        _lastAvatarKey = '';   // force a fresh video load
        triggerAvatarUpdate();
    });
    
    // Voice Control event handler
    $('voiceToggleBtn')?.addEventListener('click', toggleVoiceControl);

    // Age-Based Profile UI Triggers
    $('ageProfileBtn')?.addEventListener('click', openAgeModal);
    $('mobileAgePill')?.addEventListener('click', openAgeModal);
    $('switchProfileDashBtn')?.addEventListener('click', openAgeModal);
    $('closeAgeModalBtn')?.addEventListener('click', closeAgeModal);
    $('openAgeFromTermBtn')?.addEventListener('click', () => { closeTerminalModal(); openAgeModal(); });
    $('termOpenAgeBtn')?.addEventListener('click', () => { closeTerminalModal(); openAgeModal(); });

    document.querySelectorAll('.age-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchAgeProfile(btn.dataset.age);
        });
    });
    document.querySelectorAll('.age-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if(e.target.tagName !== 'BUTTON') {
                switchAgeProfile(card.dataset.age);
            }
        });
    });

    // Station Terminal Diagnostics Triggers
    $('terminalDiagBtn')?.addEventListener('click', openTerminalModal);
    $('mobileTermBtn')?.addEventListener('click', openTerminalModal);
    $('dashTerminalBtn')?.addEventListener('click', openTerminalModal);
    $('closeTerminalBtn')?.addEventListener('click', closeTerminalModal);

    // Master Permissions Triggers ("Ask all permissions at once for terminal")
    $('confirmAllPermsBtn')?.addEventListener('click', requestAllTerminalPermissions);
    $('termAuthorizeAllBtn')?.addEventListener('click', requestAllTerminalPermissions);

    // Individual Camera-Only Triggers
    $('confirmCameraBtn')?.addEventListener('click', requestCameraPermission);
    $('confirmCameraOnlyBtn')?.addEventListener('click', requestCameraPermission);
    $('termStartCameraOnlyBtn')?.addEventListener('click', requestCameraPermission);

    // Modal Close Triggers
    $('closeCameraModalBtn')?.addEventListener('click', closeCameraModal);
    $('cancelCameraBtn')?.addEventListener('click', closeCameraModal);

    // Camera request click triggers
    $('btnRequestCamera')?.addEventListener('click', openCameraModal);
    $('camStatusPill')?.addEventListener('click', openCameraModal);
    $('mobileCamPill')?.addEventListener('click', openCameraModal);
    document.querySelectorAll('.btn-req-cam').forEach(btn => {
        btn.addEventListener('click', openCameraModal);
    });


    $('camStopBtn')?.addEventListener('click', stopCamera);

    // Fast Website Launch (Replaces old sluggish 2.5s artificial delay with instant 300ms transition)
    let appLaunched = false;
    function launchStationApp(){
        if(appLaunched) return;
        appLaunched = true;
        load.bar.style.width='100%';
        clearInterval(load.iv);
        $('loadingTip').textContent='Station calibrated. Launching workstation...';
        const ls = $('loadingScreen');
        if(ls){
            ls.style.opacity='0';
            ls.style.transition='opacity 0.35s ease';
            setTimeout(()=>{
                ls.style.display='none';
                $('appShell').style.display='flex';
            }, 350);
        }
    }

    // Skip Button for instant 0ms entry
    $('skipLoadingBtn')?.addEventListener('click', launchStationApp);

    // Fast automatic launch in 400ms (drastically cuts website wait time from 3600ms to 400ms!)
    setTimeout(launchStationApp, 400);

    // Initialize Active Age Profile & Hardware Terminal Telemetry
    syncAgeProfileUI();
    updateTerminalUI();
    logTerminal(`> SYS_BOOT: Wellness AI Workstation ready in [${S.ageProfile.toUpperCase()}] mode.`);
});
