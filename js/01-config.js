/* ============================================================
   WellnessAI Studio — app.js
   AI-Powered Student Wellness Platform
   Modules: Posture AI | Stretch Trainer | Lighting Detector |
            Gamification | FitMove Exercise Counter
   ============================================================ */
'use strict';

// ============================================================
// LANDMARK INDICES (MediaPipe Pose)
// ============================================================
const LM = {
    NOSE:0, L_EYE:1, R_EYE:2, L_EAR:7, R_EAR:8,
    L_SHOULDER:11, R_SHOULDER:12, L_ELBOW:13, R_ELBOW:14,
    L_WRIST:15,    R_WRIST:16,
    L_HIP:23,  R_HIP:24,
    L_KNEE:25, R_KNEE:26,
    L_ANKLE:27, R_ANKLE:28
};

// SVG Icon Helper Definitions for UI & Modules
const SVG_ICONS = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    camera: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    water: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    stretch: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="4" r="2"/><path d="M5 20l4-3 3 1 3-1 4 3"/><path d="M9 14l3-4 3 4"/></svg>',
    fitness: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"/></svg>',
    posture: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v8"/><path d="M9 11l3 1 3-1"/><path d="M10 21.5l2-6 2 6"/></svg>',
    eco: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>',
    voice: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
    target: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    award: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    fire: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6M10 22h4M15 11a5 5 0 1 0-6 0c0 1.5 1 2.5 1 3h4c0-.5 1-1.5 1-3z"/></svg>',
    cross: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    smile: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    meh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    frown: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
};

// ============================================================
// AGE-BASED PROFILES & BIOMECHANICAL MODELS
// ============================================================
const AGE_PROFILES = {
    school: {
        id: 'school',
        label: 'School / Kids',
        sublabel: 'Ages 6–13 • Junior Scholar',
        icon: '🎒',
        greetingTitle: 'Junior Health Station',
        greetingDesc: 'Ergonomics, growth posture & healthy study endurance.',
        userGreeting: 'Junior Scholar',
        pomMinutes: 25,
        waterGoal: 1500,
        postureSettings: {
            spineMinAngle: 140,
            cervicalMinRatio: 0.28,
            maxEyeDist: 0.20,
            leanSlopeThreshold: 0.15,
            postureSensitivity: 'gentle'
        },
        tips: [
            'Keep your schoolbag light and wear both straps evenly across shoulders.',
            'Sit with your back resting comfortably against your study chair.',
            'Keep your study book or tablet at chest-to-eye height.',
            'Take a 20-second blinking break after every chapter.',
            'Drink water between study subjects to stay alert and sharp.',
            'Feet flat on the floor — use a foot stool if legs dangle.'
        ],
        avatarDefault: 'shinchan',
        ergoPreset: { height: 135, setup: 'fixed_child' },
        stretches: [
            {
                id:'giraffe_left', name:'Giraffe Neck Left', icon: SVG_ICONS.arrowLeft,
                desc:'Slowly tilt your head to the LEFT like a giraffe reaching tall',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return n.x > (ls.x+rs.x)/2 + 0.06;
                }
            },
            {
                id:'giraffe_right', name:'Giraffe Neck Right', icon: SVG_ICONS.arrowRight,
                desc:'Slowly tilt your head to the RIGHT side',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return n.x < (ls.x+rs.x)/2 - 0.06;
                }
            },
            {
                id:'superhero_fly', name:'Superhero Chest Fly', icon: SVG_ICONS.stretch,
                desc:'Spread both arms wide and puff your chest like a hero flying',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!lw||!rw||!ls||!rs) return false;
                    return Math.abs(lw.x - rw.x) > 0.40;
                }
            },
            {
                id:'shoulder_roll', name:'Shoulder Star Roll', icon: SVG_ICONS.repeat,
                desc:'Shrug shoulders up toward ears, then roll them back',
                detect(r){
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER), n=lm(r,LM.NOSE);
                    if(!ls||!rs||!n) return false;
                    return ((ls.y+rs.y)/2 - n.y) < 0.16;
                }
            },
            {
                id:'sky_reach', name:'Reach for the Stars', icon: SVG_ICONS.fitness,
                desc:'Reach BOTH hands high toward the ceiling and stretch tall',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    const lUp = lw ? lw.y < ls.y-0.06 : false;
                    const rUp = rw ? rw.y < rs.y-0.06 : false;
                    return lUp && rUp;
                }
            }
        ]
    },
    college: {
        id: 'college',
        label: 'College / Exam',
        sublabel: 'Ages 14–22 • Deep Study & Tech-Neck',
        icon: '📚',
        greetingTitle: 'Academic Study Station',
        greetingDesc: 'Exam endurance, digital study fatigue prevention & posture analytics.',
        userGreeting: 'Scholar',
        pomMinutes: 45,
        waterGoal: 2000,
        postureSettings: {
            spineMinAngle: 148,
            cervicalMinRatio: 0.34,
            maxEyeDist: 0.185,
            leanSlopeThreshold: 0.12,
            postureSensitivity: 'strict'
        },
        tips: [
            'Prevent Tech-Neck: Keep laptop screen top at eyebrow level.',
            'Exam Sprint: Follow 45-minute deep focus blocks with 5-minute eye rest.',
            'Avoid couch slouching: Use a firm chair during intensive study.',
            '20-20-20 Rule: Every 20 minutes, look at an object 20 feet away for 20s.',
            'Hydrate frequently: Brain cognition drops by 12% under mild dehydration.',
            'Unclench your jaw and drop your shoulders away from your ears.'
        ],
        avatarDefault: 'goku',
        ergoPreset: { height: 168, setup: 'laptop_stand' },
        stretches: [
            {
                id:'cervical_retract', name:'Tech-Neck Retraction', icon: SVG_ICONS.arrowLeft,
                desc:'Gently tuck chin inward (double-chin) and hold head upright',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return Math.abs(n.x - (ls.x+rs.x)/2) < 0.05 && ((ls.y+rs.y)/2 - n.y) > 0.19;
                }
            },
            {
                id:'trapezius_roll', name:'Upper Trapezius Release', icon: SVG_ICONS.stretch,
                desc:'Slowly tilt your ear toward your shoulder and breathe out',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return Math.abs(n.x - (ls.x+rs.x)/2) > 0.07;
                }
            },
            {
                id:'wrist_extensor', name:'Keyboard & Pen Wrist Release', icon: SVG_ICONS.repeat,
                desc:'Extend arm forward and gently pull fingers backward to decompress',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    return (lw && Math.abs(lw.y-ls.y)<0.16) || (rw && Math.abs(rw.y-rs.y)<0.16);
                }
            },
            {
                id:'overhead_spine', name:'Spinal Decompression Stretch', icon: SVG_ICONS.fitness,
                desc:'Interlock fingers and push palms upward toward ceiling',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    return (lw && rw) ? (lw.y < ls.y-0.06 && rw.y < rs.y-0.06) : false;
                }
            }
        ]
    },
    work: {
        id: 'work',
        label: 'Work / Desk Pro',
        sublabel: 'Ages 23–55 • 8h Sedentary & RSI Care',
        icon: '💼',
        greetingTitle: 'Workplace Ergonomics Station',
        greetingDesc: 'Lumbar support, carpal tunnel prevention & standing desk transitions.',
        userGreeting: 'Professional',
        pomMinutes: 50,
        waterGoal: 2500,
        postureSettings: {
            spineMinAngle: 152,
            cervicalMinRatio: 0.38,
            maxEyeDist: 0.175,
            leanSlopeThreshold: 0.10,
            postureSensitivity: 'precision'
        },
        tips: [
            'Maintain neutral wrist angle: 90° elbow flexion with loose wrists.',
            'Lower back support: Ensure lumbar curve is firmly supported by chair back.',
            'Dual Screen Alignment: Keep primary monitor directly centered in line of sight.',
            'Standing Desk Transition: Alternate 45 min sitting with 15 min standing.',
            'Carpal Tunnel Prevention: Relax fingers and shake wrists between typing sprints.',
            'Blink consciously: Staring at spreadsheets reduces blink frequency by 60%.'
        ],
        avatarDefault: 'gojo',
        ergoPreset: { height: 175, setup: 'standing_desk' },
        stretches: [
            {
                id:'thoracic_twist', name:'Seated Thoracic Rotation', icon: SVG_ICONS.repeat,
                desc:'Twist torso gently while keeping hips anchored on chair',
                detect(r){
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    return Math.abs(ls.y - rs.y) > 0.08;
                }
            },
            {
                id:'carpal_glide', name:'Carpal Tunnel Nerve Glide', icon: SVG_ICONS.fitness,
                desc:'Extend wrist and spread fingers to decompress median nerve',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    return (lw && lw.y < ls.y+0.1) || (rw && rw.y < rs.y+0.1);
                }
            },
            {
                id:'desk_chest', name:'Pectoral & Desk Chest Opener', icon: SVG_ICONS.stretch,
                desc:'Clasp hands behind back and gently open chest upward',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs||!lw||!rw) return false;
                    return Math.abs(lw.x - rw.x) > 0.42;
                }
            },
            {
                id:'lumbar_extension', name:'Standing Lumbar Arch', icon: SVG_ICONS.arrowRight,
                desc:'Place hands on hips and lean slightly back to decompress lower back',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return ((ls.y+rs.y)/2 - n.y) < 0.22;
                }
            }
        ]
    },
    senior: {
        id: 'senior',
        label: 'Senior / Gentle',
        sublabel: 'Ages 55+ • Gentle Mobility & Joint Care',
        icon: '🌿',
        greetingTitle: 'Gentle Mobility Station',
        greetingDesc: 'Low-impact mobility, joint stiffness relief & comfortable ergonomics.',
        userGreeting: 'Senior Member',
        pomMinutes: 20,
        waterGoal: 1800,
        postureSettings: {
            spineMinAngle: 135,
            cervicalMinRatio: 0.28,
            maxEyeDist: 0.21,
            leanSlopeThreshold: 0.16,
            postureSensitivity: 'relaxed'
        },
        tips: [
            'Comfort over rigidity: Shift positions gently whenever you feel tension.',
            'Gentle head turns keep cervical joints lubricated and mobile.',
            'Support your lower back with a soft ergonomic cushion.',
            'Sip warm water regularly throughout the morning and afternoon.',
            'Keep ambient lighting bright to minimize visual squinting.',
            'Ankle rotations prevent lower-limb fluid pooling while sitting.'
        ],
        avatarDefault: 'goku',
        ergoPreset: { height: 160, setup: 'fixed_child' },
        stretches: [
            {
                id:'gentle_neck', name:'Gentle Seated Neck Turn', icon: SVG_ICONS.arrowLeft,
                desc:'Turn head slowly left and right without straining',
                detect(r){
                    const n=lm(r,LM.NOSE), ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!n||!ls||!rs) return false;
                    return Math.abs(n.x - (ls.x+rs.x)/2) > 0.05;
                }
            },
            {
                id:'gentle_shrug', name:'Gentle Shoulder Rolls', icon: SVG_ICONS.stretch,
                desc:'Slowly shrug and circle shoulders in a calm rhythm',
                detect(r){
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER), n=lm(r,LM.NOSE);
                    if(!ls||!rs||!n) return false;
                    return ((ls.y+rs.y)/2 - n.y) < 0.18;
                }
            },
            {
                id:'gentle_arms', name:'Gentle Arm Elevation', icon: SVG_ICONS.repeat,
                desc:'Raise one or both arms comfortably toward shoulder level',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs) return false;
                    return (lw && lw.y < ls.y) || (rw && rw.y < rs.y);
                }
            },
            {
                id:'calm_chest', name:'Calm Chest Expansion & Breath', icon: SVG_ICONS.fitness,
                desc:'Inhale deeply as you gently open shoulders, exhale softly',
                detect(r){
                    const lw=lm(r,LM.L_WRIST), rw=lm(r,LM.R_WRIST);
                    const ls=lm(r,LM.L_SHOULDER), rs=lm(r,LM.R_SHOULDER);
                    if(!ls||!rs||!lw||!rw) return false;
                    return Math.abs(lw.x - rw.x) > 0.35;
                }
            }
        ]
    }
};

let STRETCHES = AGE_PROFILES.school.stretches;

// ============================================================
// ACHIEVEMENTS
// ============================================================
const ACHIEVEMENTS = [
    { id:'first',    icon: SVG_ICONS.star,     name:'First Step',     desc:'Earn your first point',           cond:s=>s.points>=1 },
    { id:'posture5', icon: SVG_ICONS.posture,  name:'Good Posture',   desc:'Maintain posture for 5 minutes',  cond:s=>s.posturePoints>=50 },
    { id:'stretch3', icon: SVG_ICONS.stretch,  name:'Stretch Master', desc:'Complete 3 stretch sessions',     cond:s=>s.stretchPoints>=180 },
    { id:'reps50',   icon: SVG_ICONS.fitness,  name:'Iron Will',      desc:'Complete 50 total reps',          cond:s=>s.totalReps>=50 },
    { id:'streak3',  icon: SVG_ICONS.fire,     name:'3-Day Streak',   desc:'Use app 3 days in a row',        cond:s=>s.streak>=3 },
    { id:'pts100',   icon: SVG_ICONS.award,    name:'Century Club',   desc:'Earn 100 total points',           cond:s=>s.points>=100 },
    { id:'pts500',   icon: SVG_ICONS.award,    name:'Elite Wellness', desc:'Earn 500 total points',           cond:s=>s.points>=500 },
    { id:'reps100',  icon: SVG_ICONS.fitness,  name:'Fitness Hero',   desc:'Complete 100 total reps',        cond:s=>s.totalReps>=100 },
    { id:'noAlert',  icon: SVG_ICONS.target,   name:'Perfect Session',desc:'Zero posture alerts in a session',cond:s=>s.alerts===0&&s.points>0 }
];

// ============================================================
// POSTURE TIPS ROTATION
// ============================================================
let TIPS = AGE_PROFILES[localStorage.getItem('wa_age_profile') || 'school'].tips;
