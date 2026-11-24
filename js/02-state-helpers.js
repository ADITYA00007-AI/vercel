'use strict';
// ============================================================
// STATE
// ============================================================
const S = {
    // Persistent (localStorage)
    points:       parseInt(localStorage.getItem('wa_pts')  || '0'),
    streak:       parseInt(localStorage.getItem('wa_str')  || '0'),
    streakCountedToday: false,
    totalReps:    parseInt(localStorage.getItem('wa_reps') || '0'),
    lastDate:     localStorage.getItem('wa_date') || '',
    ageProfile:   localStorage.getItem('wa_age_profile') || 'school',
    permissions:  { camera: false, mic: false, notif: false, audio: false },

    // Session
    posturePoints:0, stretchPoints:0, fitmovePoints:0,
    penalties:0, alerts:0,

    // Posture
    postureScore: 0,
    postureHistory: [],
    lastAlertTime: 0,
    lastPointTime: Date.now(),
    lastRecordTime: 0,
    lastLightTime: 0,
    tipIndex: 0,

    // Camera / MediaPipe
    cameraReady: false,
    poseInitialized: false,
    poseResults: null,
    currentPanel: 'dashboard',
    
    // Anime Avatar and Advanced Features
    selectedAvatarChar: 'goku',
    selectedGokuForm: 'normal',
    ecoOverlayActive: false,
    lastFaceDetectedTime: Date.now(),
    pomPausedByEco: false,
    voiceActive: false,
    recognition: null,

    // Hydration
    waterMl: parseInt(localStorage.getItem('wa_water_ml') || '0'),
    waterGoal: 2000,
    waterTimerSec: 45 * 60,
    waterInterval: null,
    waterPoints: 0,

    // Ergonomic Calculator
    ergoHeight: parseInt(localStorage.getItem('wa_ergo_height') || '165'),
    ergoUnit: localStorage.getItem('wa_ergo_unit') || 'cm',
    ergoSetup: localStorage.getItem('wa_ergo_setup') || 'laptop_stand',


    // Pomodoro
    pomRunning: false,
    pomSec: 25*60,
    pomInterval: null,

    // FitMove
    fitActive:   false,
    fitExercise: 'squat',
    fitTarget:   10,
    fitReps:     0,
    fitState:    'up',   // 'up' | 'down' | 'in' | 'out'
    fitStart:    null,

    // Stretch
    stretchActive: false,
    stretchIdx:    0,
    stretchStars:  [],
    holdInterval:  null,
    holdSec:       0,

    // Charts
    postureChart: null,
    progChart:    null,

    // Activity log
    activities: [],
};

// ============================================================
// HELPERS
// ============================================================
const $  = id => document.getElementById(id);
const lm = (r,i) => { if(!r?.poseLandmarks) return null; const p=r.poseLandmarks[i]; return (p&&p.visibility>0.3)?p:null; };

function calcAngle(A,B,C){
    const rad = Math.atan2(C.y-B.y,C.x-B.x)-Math.atan2(A.y-B.y,A.x-B.x);
    let deg = Math.abs(rad*180/Math.PI);
    return deg>180 ? 360-deg : deg;
}

function dist2d(A,B){ return Math.sqrt((A.x-B.x)**2+(A.y-B.y)**2); }

let toastTimer = null;
function showToast(icon,title,msg){
    const iconEl = $('toastIcon');
    if(iconEl){
        if(typeof icon === 'string' && icon.startsWith('<svg')){
            iconEl.innerHTML = icon;
        } else if(SVG_ICONS[icon]){
            iconEl.innerHTML = SVG_ICONS[icon];
        } else {
            // Map legacy emojis or plain keys to appropriate SVGs
            const map = {
                '💡': SVG_ICONS.bulb,
                '🌞': SVG_ICONS.sun,
                '☀️': SVG_ICONS.sun,
                '🌙': SVG_ICONS.moon,
                '⚠️': SVG_ICONS.warning,
                '✅': SVG_ICONS.check,
                '❌': SVG_ICONS.cross,
                '📷': SVG_ICONS.camera,
                '💧': SVG_ICONS.water,
                '🧘': SVG_ICONS.stretch,
                '🏋️': SVG_ICONS.fitness,
                '⭐': SVG_ICONS.star,
                '🎉': SVG_ICONS.award,
                '🎊': SVG_ICONS.award,
                '🔥': SVG_ICONS.fire,
                '🍃': SVG_ICONS.eco,
                '🎙️': SVG_ICONS.voice,
                'ℹ️': SVG_ICONS.info,
                '😕': SVG_ICONS.frown
            };
            iconEl.innerHTML = map[icon] || SVG_ICONS.info;
        }
    }
    $('toastTitle').textContent=title;
    $('toastMsg').textContent=msg;
    const t=$('alertToast');
    t.classList.add('show');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>t.classList.remove('show'), 4200);
}

// ============================================================
// GAMIFICATION
// ============================================================
function addPoints(amt,label,icon='star'){
    if(amt>0) registerDailyEngagement();
    S.points = Math.max(0, S.points+amt);
    localStorage.setItem('wa_pts', S.points);
    syncPointsUI();
    updateTree();
    if(label){
        const cleanLabel = label.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        addActivity(cleanLabel, (amt>0?'+':'')+amt+' pts');
    }
    checkAchievements();
}

function syncPointsUI(){
    $('sidebarPoints').textContent = S.points;
    $('dashPoints').textContent    = S.points;
}

function addActivity(text, pts){
    if(typeof logSession==='function') logSession(text,pts);
    S.activities.unshift({text,pts,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
    if(S.activities.length>8) S.activities.pop();
    const el=$('activityList');
    el.innerHTML = S.activities.map(a=>`
        <div class="activity-item">
            <span class="act-text">${a.text}</span>
            <span class="act-pts">${a.pts}</span>
        </div>`).join('');
}

const TREE_LEVELS = [
    { max:20,        level:'Stage I: Seedling',    scale:0.52, op:0.55 },
    { max:50,        level:'Stage II: Sprout',      scale:0.70, op:0.72 },
    { max:120,       level:'Stage III: Sapling',    scale:0.88, op:0.88 },
    { max:300,       level:'Stage IV: Young Tree',  scale:1.00, op:1.00 },
    { max:Infinity,  level:'Stage V: Mature Flora', scale:1.18, op:1.00 },
];

function updateTree(){
    const p=S.points;
    const idx = TREE_LEVELS.findIndex(t=>p<t.max);
    const cur = TREE_LEVELS[idx===-1?TREE_LEVELS.length-1:idx];

    const tree=$('wellnessTree');
    if(tree){ tree.style.transform=`scale(${cur.scale})`; tree.style.opacity=cur.op; }
    const badge=$('treeLevelBadge');
    if(badge) badge.textContent=cur.level;

    const nextEl=$('treeNextLevel');
    if(nextEl){
        if(cur.max===Infinity){
            nextEl.textContent='Optimal specimen maturity reached';
        } else {
            nextEl.textContent=`${cur.max - p} pts to ${TREE_LEVELS[idx+1].level.replace(/Stage [IVX]+:\s*/,'')}`;
        }
    }
}

function checkAchievements(){
    const grid=$('achGrid');
    if(!grid) return;
    grid.innerHTML = ACHIEVEMENTS.map(a=>{
        const ok=a.cond(S);
        return `<div class="ach-item ${ok?'unlocked':'locked'}" title="${a.desc}">
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-name">${a.name}</div>
        </div>`;
    }).join('');
}
