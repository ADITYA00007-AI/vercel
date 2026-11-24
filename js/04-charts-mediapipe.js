'use strict';
// ============================================================
// CHARTS
// ============================================================
function initCharts(){
    if(typeof Chart==='undefined'){ console.warn('Chart.js unavailable (offline?) — charts disabled'); return; }
    Chart.defaults.color = '#847A70';
    Chart.defaults.font.family = "'Source Sans 3', system-ui, sans-serif";

    const makeChart=(canvasId,color)=>{
        const ctx=$(canvasId)?.getContext('2d');
        if(!ctx) return null;
        const grad=ctx.createLinearGradient(0,0,0,200);
        grad.addColorStop(0,color+'33');
        grad.addColorStop(1,color+'00');
        return new Chart(ctx,{
            type:'line',
            data:{
                labels:[],
                datasets:[{
                    data:[],
                    borderColor:color,
                    backgroundColor:grad,
                    borderWidth:2,fill:true,tension:0.45,
                    pointRadius:2,pointBackgroundColor:color,
                    pointBorderColor:'transparent'
                }]
            },
            options:{
                responsive:true, maintainAspectRatio:false,
                animation:{duration:300},
                plugins:{legend:{display:false}},
                scales:{
                    x:{display:false},
                    y:{
                        min:0,max:100,
                        grid:{color:'#DDD4C4'},
                        ticks:{font:{size:11,family:"'JetBrains Mono', monospace"},color:'#847A70'}
                    }
                }
            }
        });
    };

    S.postureChart = makeChart('postureChart','#1E5E41');
    S.progChart    = makeChart('progressChart','#B47214');
}

function updateCharts(){
    const data=S.postureHistory;
    const labels=data.map((_,i)=>i*5+'s');
    [S.postureChart,S.progChart].forEach(c=>{
        if(!c) return;
        c.data.labels=labels;
        c.data.datasets[0].data=data;
        c.update('none');
    });
}

// ============================================================
// MEDIAPIPE POSE SETUP
// ============================================================
const CANVASES = {};
const CTXS = {};

function drawToCanvas(r, canvas, ctx){
    if(!canvas||!ctx) return;
    const vid=$('input_video');

    // Set canvas dimensions from the actual video/image
    const srcW = r.image?.width || vid.videoWidth || 640;
    const srcH = r.image?.height || vid.videoHeight || 480;
    if(canvas.width !== srcW)  canvas.width  = srcW;
    if(canvas.height !== srcH) canvas.height = srcH;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw video frame mirrored (selfie / natural view)
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(r.image, 0, 0, W, H);
    ctx.restore();

    if(r.poseLandmarks){
        // Draw connections — also mirrored so they align with the flipped video
        const CONN=[
            [LM.NOSE,LM.L_EYE],[LM.NOSE,LM.R_EYE],
            [LM.L_EYE,LM.L_EAR],[LM.R_EYE,LM.R_EAR],
            [LM.L_SHOULDER,LM.R_SHOULDER],
            [LM.L_SHOULDER,LM.L_ELBOW],[LM.L_ELBOW,LM.L_WRIST],
            [LM.R_SHOULDER,LM.R_ELBOW],[LM.R_ELBOW,LM.R_WRIST],
            [LM.L_SHOULDER,LM.L_HIP],[LM.R_SHOULDER,LM.R_HIP],
            [LM.L_HIP,LM.R_HIP],
            [LM.L_HIP,LM.L_KNEE],[LM.L_KNEE,LM.L_ANKLE],
            [LM.R_HIP,LM.R_KNEE],[LM.R_KNEE,LM.R_ANKLE]
        ];
        ctx.save();
        // Mirror landmark coordinates: x becomes (1 - x) to match flipped video
        ctx.strokeStyle='#1E5E41';
        ctx.lineWidth=2.5;
        for(const [a,b] of CONN){
            const A=r.poseLandmarks[a], B=r.poseLandmarks[b];
            if(!A||!B||A.visibility<0.3||B.visibility<0.3) continue;
            ctx.beginPath();
            ctx.moveTo((1 - A.x)*W, A.y*H);
            ctx.lineTo((1 - B.x)*W, B.y*H);
            ctx.stroke();
        }
        // Draw landmark dots
        ctx.fillStyle='#BA2D1D';
        for(const p of r.poseLandmarks){
            if(p.visibility<0.3) continue;
            ctx.beginPath();
            ctx.arc((1 - p.x)*W, p.y*H, 3.5, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function onPoseResults(r){
    S.poseResults=r;

    // Eco Mode presence detection check
    const personDetected = r.poseLandmarks && r.poseLandmarks[LM.NOSE] && r.poseLandmarks[LM.NOSE].visibility > 0.45;
    if(personDetected){
        S.lastFaceDetectedTime = Date.now();
        if(S.ecoOverlayActive){
            deactivateEcoMode();
        }
    } else {
        checkEcoTimeout();
    }

    // Pick active canvas
    const panel=S.currentPanel;
    let canvas, ctx;
    if(panel==='posture'||panel==='dashboard'){
        canvas=CANVASES.posture; ctx=CTXS.posture;
    } else if(panel==='stretch'){
        canvas=CANVASES.stretch; ctx=CTXS.stretch;
    } else if(panel==='fitmove'){
        canvas=CANVASES.fitmove; ctx=CTXS.fitmove;
    } else {
        canvas=CANVASES.posture; ctx=CTXS.posture;
    }

    drawToCanvas(r,canvas,ctx);

    // Lighting check every 4 seconds
    const now=Date.now();
    if(now-S.lastLightTime>4000){
        S.lastLightTime=now;
        checkLighting(canvas);
    }

    // Run modules
    updatePostureUI(r);
    if(panel==='stretch') processStretch(r);
    if(panel==='fitmove') processFitMove(r);

    // First camera connect
    if(!S.cameraReady){
        S.cameraReady=true;
        const dot=$('camDot');
        if(dot) dot.className='cam-dot online';
        const stTxt=$('camStatusText');
        if(stTxt) stTxt.textContent='Camera Online';
        
        // Hide all camera placeholders across all panels
        $('posturePlaceholder')?.style.setProperty('display', 'none');
        $('stretchPlaceholder')?.style.setProperty('display', 'none');
        $('fitmovePlaceholder')?.style.setProperty('display', 'none');
        $('dashCamPrompt')?.style.setProperty('display', 'none');

        const stopBtn=$('camStopBtn');
        if(stopBtn) stopBtn.style.display='block';
        showToast('check','Camera Connected!','Biomechanics sensor telemetry is now active.');
        addActivity('Camera telemetry connected', '0 pts');
    }
}

let mediaCamera = null;
let poseInstance = null; // FIX 3: stored globally so stopCamera() can close/destroy it

// Hardware video constraints optimized for zero-buffer real-time pose tracking
const FAST_VIDEO_CONSTRAINTS = {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user'
};

// Singleton WebAudio Context for crisp zero-latency feedback
let _globalAudioCtx = null;
function getAudioContext() {
    try {
        if (!_globalAudioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) _globalAudioCtx = new AudioCtx();
        }
        if (_globalAudioCtx && _globalAudioCtx.state === 'suspended') {
            _globalAudioCtx.resume().catch(() => {});
        }
    } catch(e){}
    return _globalAudioCtx;
}

function unlockAudioContext() {
    const ctx = getAudioContext();
    if (ctx) {
        S.permissions.audio = true;
        logTerminal('[AUDIO] WebAudio biofeedback synthesizer online.', 'success');
        updateTerminalUI();
    }
}

function playPostureChime(good = true){
    try {
        if (S.ageProfile === 'work' && S.meetingMode) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = good ? 'sine' : 'triangle';
        if (good) {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } else {
            osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
            osc.frequency.exponentialRampToValueAtTime(220.00, ctx.currentTime + 0.16); // A3
            gain.gain.setValueAtTime(0.16, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.28);
        }
    } catch(e){}
}
