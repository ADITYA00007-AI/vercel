'use strict';
// ============================================================
// LIGHTING DETECTOR
// ============================================================
function checkLighting(canvas){
    if(!canvas||canvas.width===0) return;
    try{
        const ctx = (canvas === CANVASES.posture ? CTXS.posture
                   : canvas === CANVASES.stretch ? CTXS.stretch
                   : canvas === CANVASES.fitmove ? CTXS.fitmove
                   : canvas.getContext('2d', { willReadFrequently: true }));
        const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let sum=0,count=0;
        for(let i=0;i<d.length;i+=4*16){
            sum+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
            count++;
        }
        const bright=count>0?sum/count:128;
        const dot=$('lightingDot'), txt=$('lightingText');
        if(bright<60){
            dot.className='lighting-dot dark';
            txt.textContent='Low Ambient Lux';
            showToast('bulb','Room Too Dark!','Increase workspace illumination to protect eyesight.');
        } else if(bright>200){
            dot.className='lighting-dot bright';
            txt.textContent='Glare Detected';
            showToast('sun','Too Much Glare!','Adjust screen tilt or blinds to minimize glare.');
        } else {
            dot.className='lighting-dot good';
            txt.textContent='Optimal Illumination';
        }
    } catch(e){}
}

// ============================================================
// POSTURE MODULE
// ============================================================
function analyzePosture(r){
    const earL=lm(r,LM.L_EAR), earR=lm(r,LM.R_EAR);
    const shL=lm(r,LM.L_SHOULDER), shR=lm(r,LM.R_SHOULDER);
    const hipL=lm(r,LM.L_HIP);
    const nose=lm(r,LM.NOSE);
    const eyeL=lm(r,LM.L_EYE), eyeR=lm(r,LM.R_EYE);

    if(!shL&&!shR) return null;

    let score=100, spineAngle=null, headSt='good', distSt='good';
    const activeProf = AGE_PROFILES[S.ageProfile] || AGE_PROFILES.school;
    const settings = activeProf.postureSettings || {};
    const thr = getPostureThresholds(settings);   // personal after calibration, profile defaults before
    let tip = (activeProf.tips && activeProf.tips.length > 0) 
        ? activeProf.tips[S.tipIndex % activeProf.tips.length] 
        : TIPS[S.tipIndex % TIPS.length];

    const shMidX = ((shL?.x||0)+(shR?.x||0))/(shL&&shR?2:1);
    const shMidY = ((shL?.y||0)+(shR?.y||0))/(shL&&shR?2:1);
    const shWidth = shL&&shR ? dist2d(shL, shR) : 0.25;

    const ear = earL||earR;
    const sh  = shL||shR;

    // ---- 1. Robust Spine/Neck Slouch check (profile-adapted) ----
    if(ear && sh){
        const refHip = (hipL && hipL.visibility > 0.4) ? hipL : { x: sh.x, y: sh.y + 0.5 };
        spineAngle = Math.round(calcAngle(ear, sh, refHip));
        if(spineAngle < thr.spineCrit){ 
            score -= 35; 
            tip = activeProf.tips ? activeProf.tips[0] : 'Critical slouch detected. Re-align spinal axis upright.'; 
        } else if(spineAngle < thr.spineWarn){ 
            score -= 15; 
            tip = 'Straighten thoracic spine to reduce lumbar load.'; 
        }
    }

    // ---- 2. Distance-independent Head Height check (normalized ratio) ----
    if(nose && shL && shR){
        const gap = shMidY - nose.y;
        const ratio = gap / shWidth; // Normalized by shoulder width to remove distance scaling error
        if(ratio < thr.ratioCrit){ 
            score -= 25; 
            headSt = 'low'; 
            tip = 'Elevate head position. Cervical forward drop detected.'; 
        } else if(ratio < thr.ratioWarn){ 
            score -= 10; 
            headSt = 'low'; 
            tip = 'Keep chin neutral and aligned with breastbone.'; 
        }
    }

    // ---- 3. Screen distance: eye separation ----
    if(eyeL && eyeR){
        const eDist = dist2d(eyeL,eyeR);
        if(eDist > thr.eyeMax){ 
            score -= 20; 
            distSt = 'close'; 
            tip = 'Excessive screen proximity. Maintain 50-70cm clearance.'; 
        } else if(eDist < 0.05){ 
            distSt = 'far'; 
            tip = 'Position is too distant for accurate sensor analysis.'; 
        }
    }

    // ---- 4. Leaning Sideways (Shoulder level asymmetry) ----
    if(shL && shR){
        const leanSlope = Math.abs(shL.y - shR.y) / shWidth;
        if(leanSlope - thr.leanBase > thr.leanMax){
            score -= 15;
            tip = 'Lateral spine curvature detected. Level shoulders evenly.';
        }
    }

    score = Math.max(0,Math.min(100,score));
    return { score, spineAngle, headSt, distSt, tip };
}

let _lastDomTime = 0;
function updatePostureUI(r){
    if(typeof calibFeed === 'function') calibFeed(r);   // 10 s calibration state machine
    const res = analyzePosture(r);
    if(!res) return;
    const { score, spineAngle, headSt, distSt, tip } = res;
    S.postureScore = score;

    const now=Date.now();
    const monitoring = postureMonitoringActive();   // alerts, penalties and rewards only after calibration

    // DOM Telemetry Throttle (10 FPS cap for DOM writes keeps main thread fast and smooth)
    if(now - _lastDomTime >= 100){
        _lastDomTime = now;
        
        // Update posture score gauge
        const path=$('gaugePath');
        if(path){
            const offset=251-(score/100)*251;
            path.style.strokeDashoffset=offset;
        }
        $('gaugeValue').textContent=score;
        $('scoreStatus').textContent = !monitoring
            ? (S.calib.state==='idle' ? 'Calibrate to activate monitoring' : 'Calibrating…')
            : score>=80?'Optimal Alignment':score>=60?'Moderate Ergonomic Strain':'Suboptimal Posture — Correct Now';

        // Metric cards
        if(spineAngle!==null){
            const thrUI = getPostureThresholds(AGE_PROFILES[S.ageProfile]?.postureSettings);
            $('spineAngle').textContent=spineAngle+'°';
            $('spineBar').style.width=Math.min(100,(spineAngle/180)*100)+'%';
            const ok=spineAngle >= thrUI.spineWarn;
            $('spineStatus').textContent=ok?'Good':spineAngle>=thrUI.spineCrit?'Warning':'Poor';
            $('spineStatus').className='metric-status '+(ok?'good':spineAngle>=thrUI.spineCrit?'warning':'danger');
        }
        $('headPos').textContent = headSt==='good'?'Upright':'Too Low';
        $('headBar').style.width  = headSt==='good'?'85%':'40%';
        $('headStatus').textContent=headSt==='good'?'Good':'Adjust';
        $('headStatus').className='metric-status '+(headSt==='good'?'good':'warning');

        $('screenDist').textContent = distSt==='good' ? 'Optimal' : distSt==='close' ? 'Too Close' : 'Too Far';
        $('distBar').style.width    = distSt==='good' ? '80%' : distSt==='close' ? '98%' : '35%';
        $('distStatus').textContent = distSt==='good' ? 'Good' : 'Adjust';
        $('distStatus').className   = 'metric-status '+(distSt==='good' ? 'good' : 'warning');

        $('postureTip').textContent = monitoring ? tip : calibrationTip();
    }

    // Alert handling
    const isBad = monitoring && score<60;
    const badge=$('postureAlertBadge');
    const box=$('postureBox');
    if(badge) badge.style.display=isBad?'inline-flex':'none';
    if(box)   isBad?box.classList.add('bad-posture'):box.classList.remove('bad-posture');

    if(isBad && now-S.lastAlertTime>15000){
        S.lastAlertTime=now;
        S.alerts++;
        S.penalties+=5;
        $('dashAlerts').textContent=S.alerts;
        $('bdPenalty').textContent=S.penalties;
        addPoints(-5,'Posture deviation detected','warning');
        showToast('warning','Poor Posture Alert!',tip);
        playPostureChime(false);

        // System Desktop Notification
        if('Notification' in window && Notification.permission === 'granted'){
            try {
                new Notification('Wellness AI • Ergonomic Alert', {
                    body: tip,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23BA2D1D"/><text x="50" y="68" font-family="serif" font-size="60" text-anchor="middle" fill="%23FAF7F2">W</text></svg>'
                });
            } catch(e){}
        }
    }

    // Posture reward: +10pts per 60s of good posture
    if(monitoring && !isBad && now-S.lastPointTime>60000){
        S.lastPointTime=now;
        S.posturePoints+=10;
        $('bdPosture').textContent=S.posturePoints;
        addPoints(10,'60 seconds optimal posture maintained','posture');
        playPostureChime(true);
    }

    // Record history every 5s
    if(now-S.lastRecordTime>5000){
        S.lastRecordTime=now;
        S.postureHistory.push(score);
        if(S.postureHistory.length>24) S.postureHistory.shift();
        updateCharts();
    }

    // Update anime avatar state
    triggerAvatarUpdate();
}

// ============================================================
// FITMOVE MODULE
// ============================================================
function processFitMove(r){
    if(!S.fitActive) return;
    let feedback='', phase='';

    // --- SQUAT ---
    if(S.fitExercise==='squat'){
        const hL=lm(r,LM.L_HIP),kL=lm(r,LM.L_KNEE),aL=lm(r,LM.L_ANKLE);
        const hR=lm(r,LM.R_HIP),kR=lm(r,LM.R_KNEE),aR=lm(r,LM.R_ANKLE);
        let kAng=null;
        if(hL&&kL&&aL) kAng=calcAngle(hL,kL,aL);
        else if(hR&&kR&&aR) kAng=calcAngle(hR,kR,aR);

        if(kAng!==null){
            if(S.fitState==='up'&&kAng<105){ S.fitState='down'; feedback='Target depth reached! Rise upright.'; phase='down'; }
            else if(S.fitState==='down'&&kAng>160){ S.fitState='up'; countRep(); feedback='Repetition verified. Begin next descent.'; phase='up'; }
            else if(!feedback){
                feedback=kAng>150?'Bend knees into parallel squat':'Descend smoothly into position';
                phase=kAng>150?'up':'down';
            }
        } else { feedback='Turn slightly sideways to camera'; phase='ready'; }
    }

    // --- ARM RAISES ---
    else if(S.fitExercise==='arms'){
        const lw=lm(r,LM.L_WRIST),rw=lm(r,LM.R_WRIST);
        const ls=lm(r,LM.L_SHOULDER),rs=lm(r,LM.R_SHOULDER);
        if(ls&&rs){
            const lUp=lw?lw.y<ls.y-0.05:false;
            const rUp=rw?rw.y<rs.y-0.05:false;
            const lDn=lw?lw.y>ls.y+0.05:true;
            const rDn=rw?rw.y>rs.y+0.05:true;
            const bothUp=lUp&&rUp, bothDn=lDn&&rDn;

            if(S.fitState==='down'&&bothUp){ S.fitState='up'; feedback='Overhead extension achieved! Lower arms.'; phase='up'; }
            else if(S.fitState==='up'&&bothDn){ S.fitState='down'; countRep(); feedback='Repetition complete. Elevate arms again.'; phase='down'; }
            else if(!feedback){
                feedback=S.fitState==='down'?'Raise both arms overhead':'Lower both arms to your sides';
                phase=S.fitState;
            }
        } else { feedback='Face the camera directly'; phase='ready'; }
    }

    // --- JUMPING JACKS ---
    else if(S.fitExercise==='jacks'){
        const lw=lm(r,LM.L_WRIST),rw=lm(r,LM.R_WRIST);
        const la=lm(r,LM.L_ANKLE),ra=lm(r,LM.R_ANKLE);
        const ls=lm(r,LM.L_SHOULDER),rs=lm(r,LM.R_SHOULDER);
        if(ls&&rs){
            const sw=Math.abs(ls.x-rs.x);
            const armsUp=(lw&&rw)?(lw.y<ls.y&&rw.y<rs.y):false;
            const legsW=(la&&ra)?Math.abs(la.x-ra.x)>sw*1.5:false;
            const isOut=armsUp&&legsW;
            const isIn=!armsUp&&!legsW;

            if(S.fitState==='in'&&isOut){ S.fitState='out'; feedback='Spread achieved! Return inward.'; phase='out'; }
            else if(S.fitState==='out'&&isIn){ S.fitState='in'; countRep(); feedback='Repetition complete. Jump outward again.'; phase='in'; }
            else if(!feedback){
                feedback=S.fitState==='in'?'Jump outwards with arms raised':'Recover inward to neutral stance';
                phase=S.fitState;
            }
        } else { feedback='Step back so your full body is visible'; phase='ready'; }
    }

    // --- PUSHUPS ---
    else if(S.fitExercise==='pushup'){
        const sL=lm(r,LM.L_SHOULDER), eL=lm(r,LM.L_ELBOW), wL=lm(r,LM.L_WRIST);
        const sR=lm(r,LM.R_SHOULDER), eR=lm(r,LM.R_ELBOW), wR=lm(r,LM.R_WRIST);
        let eAng=null;
        if(sL&&eL&&wL) eAng=calcAngle(sL,eL,wL);
        else if(sR&&eR&&wR) eAng=calcAngle(sR,eR,wR);

        if(eAng!==null){
            if(S.fitState==='up'&&eAng<95){ S.fitState='down'; feedback='Full depth reached. Press upward.'; phase='down'; }
            else if(S.fitState==='down'&&eAng>145){ S.fitState='up'; countRep(); feedback='Repetition complete. Lower with control.'; phase='up'; }
            else if(!feedback){
                feedback=S.fitState==='up'?'Bend elbows to lower your chest':'Straighten arms to complete press';
                phase=S.fitState;
            }
        } else { feedback='Place camera sideways and lie on floor'; phase='ready'; }
    }

    $('formHint').textContent=feedback;
    $('phaseLabel').textContent=phase.toUpperCase();
    const dot=$('phaseDot');
    dot.className='phase-dot '+(phase==='up'||phase==='out'?'up':'down');
}

function countRep(){
    S.fitReps++;
    const el=$('repCount');
    el.textContent=S.fitReps;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    $('repPbar').style.width=Math.min(100,(S.fitReps/S.fitTarget)*100)+'%';
    if(S.fitReps>=S.fitTarget) completeFitSession();
}

function completeFitSession(){
    S.fitActive=false;
    const elapsed=Math.round((Date.now()-S.fitStart)/1000);
    S.totalReps+=S.fitReps;
    localStorage.setItem('wa_reps',S.totalReps);
    $('dashReps').textContent=S.totalReps;
    S.fitmovePoints+=30;
    $('bdFitmove').textContent=S.fitmovePoints;
    addPoints(30,`${S.fitReps} ${S.fitExercise} reps completed`,'fitness');

    $('sdReps').textContent=S.fitReps;
    $('sdTime').textContent=elapsed+'s';
    $('sdPts').textContent='+30';
    $('sessionDone').style.display='block';
    $('stopFitBtn').style.display='none';
    $('startFitBtn').style.display='block';
    $('startFitBtn').innerHTML=`${SVG_ICONS.fitness} New Set`;

    showToast('award','Exercise Complete!',`Completed ${S.fitReps} repetitions in ${elapsed}s. Earned +30 points.`);
    checkAchievements();
}

// ============================================================
// STRETCH MODULE
// ============================================================
function renderStretchList(){
    const el=$('stretchList');
    el.innerHTML=STRETCHES.map((s,i)=>{
        const done=i<S.stretchIdx;
        const active=i===S.stretchIdx&&S.stretchActive;
        const starCount=S.stretchStars[i]||0;
        const starsHtml = starCount>0 ? `<span class="s-stars-badge">${SVG_ICONS.star} ${starCount}/3</span>` : '';
        return `<div class="stretch-item ${done?'done':''} ${active?'active':''}">
            <div class="s-num">${done?SVG_ICONS.check:i+1}</div>
            <div class="s-info">
                <div class="s-name">${s.icon} <span>${s.name}</span></div>
                <div class="s-desc">${s.desc}</div>
            </div>
            <div class="s-stars">${starsHtml}</div>
        </div>`;
    }).join('');
}

function processStretch(r){
    if(!S.stretchActive || S.stretchIdx >= STRETCHES.length) return;
    const cur = STRETCHES[S.stretchIdx];
    if(!cur) return;
    const detected = cur.detect(r);

    if(detected && !S.holdInterval){
        // Begin hold countdown
        S.holdSec = 5;
        $('holdSec').textContent = 5;
        $('holdCount').style.display = 'block';
        $('holdBarWrap').style.display = 'block';
        $('holdBarFill').style.width = '100%';
        $('sfbIcon').innerHTML = SVG_ICONS.check;
        $('sfbTitle').textContent = 'Stretch Detected — Hold Position';
        $('sfbDesc').textContent = `Maintain holding the ${cur.name}...`;

        S.holdInterval = setInterval(()=>{
            S.holdSec--;
            $('holdSec').textContent = S.holdSec;
            $('holdBarFill').style.width = (S.holdSec/5)*100+'%';
            if(S.holdSec <= 0){
                clearInterval(S.holdInterval);
                S.holdInterval = null;
                $('holdCount').style.display = 'none';
                $('holdBarWrap').style.display = 'none';
                finishStretch(3); // perfect hold → 3 stars
            }
        }, 1000);
    } else if(!detected && S.holdInterval){
        // Broke the hold
        const heldFor = 5 - S.holdSec;
        clearInterval(S.holdInterval);
        S.holdInterval = null;
        $('holdCount').style.display = 'none';
        $('holdBarWrap').style.display = 'none';
        $('sfbIcon').innerHTML = SVG_ICONS.warning;
        $('sfbTitle').textContent = 'Hold Interrupted';
        $('sfbDesc').textContent = `Re-engage position: ${cur.desc}`;
        if(heldFor >= 3) finishStretch(2); // partial → 2 stars
        else if(heldFor >= 1) finishStretch(1); // short → 1 star
        // else: reset and try again (don't count this attempt)
    } else if(!detected && !S.holdInterval){
        $('sfbIcon').innerHTML = cur.icon;
        $('sfbTitle').textContent = cur.name;
        $('sfbDesc').textContent = cur.desc;
    }
}

function finishStretch(stars){
    if(S.stretchIdx >= STRETCHES.length) return;
    const curIdx = S.stretchIdx;
    const completedStretch = STRETCHES[curIdx];
    S.stretchStars[curIdx] = stars;
    S.stretchIdx++;
    addPoints(10, `${completedStretch.name} completed`, 'stretch');
    S.stretchPoints += 10;
    $('bdStretch').textContent = S.stretchPoints;

    if(S.stretchIdx >= STRETCHES.length){
        // Full session complete!
        S.stretchActive = false;
        if(S.holdInterval){ clearInterval(S.holdInterval); S.holdInterval = null; }
        $('holdCount').style.display = 'none';
        $('holdBarWrap').style.display = 'none';
        addPoints(50, 'Full stretch routine completed', 'award');
        S.stretchPoints += 50;
        $('bdStretch').textContent = S.stretchPoints;
        $('sfbIcon').innerHTML = SVG_ICONS.award;
        $('sfbTitle').textContent = 'Routine Completed';
        $('sfbDesc').textContent = 'Excellent mobility routine completed. +60 points earned!';
        $('startStretchBtn').style.display = 'block';
        $('startStretchBtn').innerHTML = `${SVG_ICONS.repeat} Restart Routine`;
        showToast('award', 'Stretch Complete!', 'Full routine finished. +60 points earned.');
        checkAchievements();
    }
    renderStretchList();
}
