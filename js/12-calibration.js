'use strict';
// ============================================================
// POSTURE CALIBRATION
// Reads the user's body for 10 seconds in good posture, stores a
// personal baseline, then switches posture monitoring on.
// ============================================================
const CALIB_CFG = {
    readySec:       3,     // time to get into position before reading starts
    captureSec:     10,    // good-posture reading time
    minSamples:     60,    // valid frames needed (about 2 s of tracking at 30 FPS)
    maxSpineSpread: 14,    // degrees of movement allowed while reading
    maxRatioSpread: 0.14,  // head-height movement allowed while reading
    autoStart:      true   // start calibrating automatically when the camera first comes online
};

S.calib = {
    state: 'idle',         // idle | ready | capturing | done
    start: 0,
    samples: [],
    baseline: null,        // { spine, ratio, eye, slope }
    prev: null,            // baseline kept while recalibrating, restored if it fails
    shown: false,
    autoTried: false,
    lastMsg: ''
};

// Same formulas analyzePosture() uses, so baseline and live readings are comparable.
function rawPostureMetrics(r){
    const shL = lm(r, LM.L_SHOULDER), shR = lm(r, LM.R_SHOULDER);
    if(!shL && !shR) return null;
    const earL = lm(r, LM.L_EAR), earR = lm(r, LM.R_EAR);
    const hipL = lm(r, LM.L_HIP), nose = lm(r, LM.NOSE);
    const eyeL = lm(r, LM.L_EYE), eyeR = lm(r, LM.R_EYE);

    const shMidY = ((shL?.y || 0) + (shR?.y || 0)) / (shL && shR ? 2 : 1);
    const shWidth = shL && shR ? dist2d(shL, shR) : 0.25;
    const ear = earL || earR, sh = shL || shR;

    let spine = null, ratio = null, eye = null, slope = null;
    if(ear && sh){
        const refHip = (hipL && hipL.visibility > 0.4) ? hipL : { x: sh.x, y: sh.y + 0.5 };
        spine = calcAngle(ear, sh, refHip);
    }
    if(nose && shL && shR) ratio = (shMidY - nose.y) / shWidth;
    if(eyeL && eyeR)       eye = dist2d(eyeL, eyeR);
    if(shL && shR)         slope = Math.abs(shL.y - shR.y) / shWidth;
    return { spine, ratio, eye, slope };
}

// Thresholds used by analyzePosture(): personal ones after calibration, profile defaults before.
function getPostureThresholds(settings){
    const s = settings || {};
    const minSpine = s.spineMinAngle || 145;
    const t = {
        spineCrit: minSpine - 8,
        spineWarn: minSpine + 4,
        ratioCrit: s.cervicalMinRatio || 0.32,
        ratioWarn: (s.cervicalMinRatio || 0.32) + 0.08,
        eyeMax:    s.maxEyeDist || 0.185,
        leanBase:  0,
        leanMax:   s.leanSlopeThreshold || 0.12
    };
    const b = S.calib.baseline;
    if(b){
        if(b.spine != null){ t.spineCrit = b.spine - 15; t.spineWarn = b.spine - 7; }
        if(b.ratio != null){ t.ratioCrit = b.ratio * 0.78; t.ratioWarn = b.ratio * 0.88; }
        if(b.eye   != null){ t.eyeMax = b.eye * 1.25; }
        if(b.slope != null){ t.leanBase = b.slope; }
    }
    return t;
}

function postureMonitoringActive(){
    return !!S.calib.baseline && S.calib.state === 'done';
}

function calibrationTip(){
    const c = S.calib;
    if(c.state === 'ready')     return 'Sit upright with your head over your shoulders. Reading starts in a moment.';
    if(c.state === 'capturing') return 'Hold your best posture and stay still while your body is being read.';
    return 'Press "Calibrate posture" and sit in your best posture for 10 seconds to activate monitoring.';
}

// ---------- UI ----------
function renderCalib(count, msg, pct){
    const ov = $('calibOverlay');
    if(!ov) return;
    ov.style.display = 'flex';
    $('calibCount').textContent = count;
    $('calibMsg').textContent = msg;
    $('calibBar').style.width = Math.max(0, Math.min(100, pct)) + '%';
}

function hideCalibOverlay(){
    const ov = $('calibOverlay');
    if(ov) ov.style.display = 'none';
    const bar = $('calibBar');
    if(bar) bar.style.width = '0';
}

function updateCalibChip(){
    const chip = $('calibChip'), btn = $('calibBtn');
    if(!chip || !btn) return;
    const c = S.calib;
    if(c.state === 'ready' || c.state === 'capturing'){
        chip.textContent = 'Calibrating…'; chip.className = 'calib-chip busy';
        btn.textContent = 'Cancel';
    } else if(postureMonitoringActive()){
        chip.textContent = 'Calibrated – monitoring active'; chip.className = 'calib-chip on';
        btn.textContent = 'Recalibrate';
    } else {
        chip.textContent = 'Not calibrated – monitoring paused'; chip.className = 'calib-chip off';
        btn.textContent = 'Calibrate posture (10 s)';
    }
}

// ---------- flow ----------
function startCalibration(auto){
    const c = S.calib;
    if(!S.cameraReady && !auto) { showToast('warning', 'Camera is off', 'Enable the camera feed first.'); return; }
    c.prev = c.baseline;
    c.baseline = null;
    c.samples = [];
    c.state = 'ready';
    c.start = Date.now();
    updateCalibChip();
    showToast('info', 'Posture calibration',
        `Sit in your best posture. Reading starts in ${CALIB_CFG.readySec} s and takes ${CALIB_CFG.captureSec} s.`);
}

function cancelCalibration(){
    const c = S.calib;
    c.baseline = c.prev; c.prev = null;
    c.state = c.baseline ? 'done' : 'idle';
    c.samples = [];
    hideCalibOverlay();
    updateCalibChip();
}

function failCalibration(reason){
    const c = S.calib;
    c.baseline = c.prev; c.prev = null;
    c.state = c.baseline ? 'done' : 'idle';
    c.samples = [];
    hideCalibOverlay();
    updateCalibChip();
    showToast('warning', 'Calibration failed', reason);
    playPostureChime(false);
}

const _median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const _spread = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * 0.9)] - s[Math.floor(s.length * 0.1)]; };

function finishCalibration(){
    const c = S.calib, s = c.samples;
    if(s.length < CALIB_CFG.minSamples){
        return failCalibration('Your head and shoulders were not visible enough. Sit so both shoulders and your face are in view, then try again.');
    }
    const col = k => s.map(x => x[k]).filter(v => v != null);
    const spine = col('spine'), ratio = col('ratio'), eye = col('eye'), slope = col('slope');

    if(spine.length >= CALIB_CFG.minSamples / 2 && _spread(spine) > CALIB_CFG.maxSpineSpread){
        return failCalibration('You moved too much during the 10 seconds. Sit still in good posture and try again.');
    }
    if(ratio.length >= CALIB_CFG.minSamples / 2 && _spread(ratio) > CALIB_CFG.maxRatioSpread){
        return failCalibration('Your head moved too much during the reading. Hold still and try again.');
    }

    const has = a => a.length >= CALIB_CFG.minSamples / 2;
    c.baseline = {
        spine: has(spine) ? _median(spine) : null,
        ratio: has(ratio) ? _median(ratio) : null,
        eye:   has(eye)   ? _median(eye)   : null,
        slope: has(slope) ? _median(slope) : null
    };
    c.prev = null;
    c.samples = [];
    c.state = 'done';
    S.lastPointTime = Date.now();
    S.lastAlertTime = Date.now();
    hideCalibOverlay();
    updateCalibChip();
    showToast('check', 'Calibration complete', 'Your personal posture baseline is saved. Monitoring is now active.');
    addActivity('Posture calibrated', '0 pts');
    playPostureChime(true);
}

// Called on every pose frame from updatePostureUI().
function calibFeed(r){
    const c = S.calib;
    if(!c.shown){
        c.shown = true;
        const row = $('calibRow');
        if(row) row.style.display = 'flex';
        updateCalibChip();
        if(CALIB_CFG.autoStart && !c.autoTried && c.state === 'idle' && !c.baseline){
            c.autoTried = true;
            startCalibration(true);
        }
    }
    if(c.state !== 'ready' && c.state !== 'capturing') return;

    const now = Date.now();
    const el = (now - c.start) / 1000;

    if(c.state === 'ready'){
        const left = Math.max(1, Math.ceil(CALIB_CFG.readySec - el));
        renderCalib(left, 'Sit upright in your best posture', 0);
        if(el >= CALIB_CFG.readySec){ c.state = 'capturing'; c.start = now; c.samples = []; }
        return;
    }

    // capturing
    const m = rawPostureMetrics(r);
    if(m && (m.spine != null || m.ratio != null)) c.samples.push(m);
    const left = Math.max(0, Math.ceil(CALIB_CFG.captureSec - el));
    renderCalib(left, m ? 'Reading your posture. Hold still.' : 'Move into view so your shoulders are visible.',
                el / CALIB_CFG.captureSec * 100);
    if(el >= CALIB_CFG.captureSec) finishCalibration();
}

// Called from stopCamera().
function resetCalibration(){
    const c = S.calib;
    c.state = 'idle'; c.baseline = null; c.prev = null; c.samples = [];
    c.shown = false; c.autoTried = false;
    hideCalibOverlay();
    const row = $('calibRow');
    if(row) row.style.display = 'none';
    updateCalibChip();
}

document.addEventListener('DOMContentLoaded', () => {
    $('calibBtn')?.addEventListener('click', () => {
        const st = S.calib.state;
        if(st === 'ready' || st === 'capturing') cancelCalibration();
        else startCalibration(false);
    });
});
