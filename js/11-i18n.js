'use strict';
// ============================================================
// HINDI / ENGLISH TOGGLE (text-node translation, covers main UI)
// ============================================================
const HI = {
 'Dashboard':'डैशबोर्ड','Live Posture':'लाइव पोस्चर','Stretch Routine':'स्ट्रेच अभ्यास','FitMove Reps':'फिटमूव रेप्स','Session Log':'सत्र लॉग','ErgoCalc Blueprint':'अर्गोकैल्क ब्लूप्रिंट',
 'Points':'अंक','Days':'दिन','Total Score':'कुल स्कोर','Day Streak':'दिनों की लड़ी','Slouch Alerts':'झुकने की चेतावनी','Move Reps':'मूव रेप्स','Water Intake':'पानी की मात्रा',
 'Enable Camera Feed':'कैमरा चालू करें','Sensor Offline':'सेंसर बंद','Disconnect Sensor':'सेंसर बंद करें','Terminal':'टर्मिनल','Eco Mode':'इको मोड','Voice OFF':'आवाज़ बंद','Voice ON':'आवाज़ चालू','Start':'शुरू','next sip':'अगला घूँट',
 'Live Ergonomic Posture Index':'लाइव पोस्चर सूचकांक','Living Specimen Tracker':'जीवित पौधा ट्रैकर','Study Session Log':'पढ़ाई सत्र लॉग','Ergonomic Visual Companion':'पोस्चर साथी','Companion Character':'साथी चुनें','Spine Angle':'रीढ़ का कोण','Cervical Head Tilt':'गर्दन/सिर का झुकाव','Screen Distance':'स्क्रीन से दूरी','Research Recommendation':'सुझाव','Good':'अच्छा',
 'Begin Guided Stretch Routine':'स्ट्रेच अभ्यास शुरू करें','Standby':'तैयार','Start Repetition Counter':'रेप गिनती शुरू करें','Halt Set':'सेट रोकें','Start Next Set':'अगला सेट शुरू करें','Repetitions Completed':'पूरे किए गए रेप्स','Select Physical Exercise':'व्यायाम चुनें','Bodyweight Squats':'स्क्वाट्स','Arm Raises':'हाथ ऊपर उठाना','Jumping Jacks':'जंपिंग जैक्स','Floor Pushups':'पुशअप्स','Exercise Set Completed':'सेट पूरा हुआ',
 'Time for a Stretch Break':'स्ट्रेच ब्रेक का समय','Begin 90-Second Routine':'90 सेकंड का अभ्यास शुरू करें','Decline (−10 pts)':'मना करें (−10 अंक)',
 'Export & Student Details':'निर्यात और छात्र विवरण','Download Session CSV':'सत्र CSV डाउनलोड करें','Clear My Data':'मेरा डेटा मिटाएँ','References & Limits':'संदर्भ और सीमाएँ',
 'Ask a parent or teacher first':'पहले माता-पिता या शिक्षक से पूछें','Continue':'आगे बढ़ें','Cancel':'रद्द करें','Close':'बंद करें',
 'Video is processed on this device only.':'वीडियो केवल इसी डिवाइस पर प्रोसेस होता है।','Nothing is recorded, uploaded or shared.':'कुछ भी रिकॉर्ड, अपलोड या साझा नहीं होता।','You can switch the camera off any time with the Disconnect button.':'आप कभी भी "सेंसर बंद करें" बटन से कैमरा बंद कर सकते हैं।',
 'A parent, guardian or teacher has said it is OK.':' माता-पिता, अभिभावक या शिक्षक ने अनुमति दी है।',
 'Authorize All Permissions at Once':'सभी अनुमतियाँ एक साथ दें','Camera Only':'केवल कैमरा','Change Age Profile':'आयु प्रोफ़ाइल बदलें','Change Age Mode':'आयु मोड बदलें','Select Ergonomic Age Profile':'आयु प्रोफ़ाइल चुनें',
 'Sustained Posture Points':'सही पोस्चर के अंक','Completed Stretch Routine Points':'स्ट्रेच के अंक','FitMove Repetition Points':'फिटमूव के अंक','Target Hydration Points':'पानी पीने के अंक','Slouch Deductions':'झुकने पर कटौती','Daily Health Points Ledger':'दैनिक स्वास्थ्य अंक',
 'Junior Scholar':'छोटे विद्वान','Wellness AI Station':'वेलनेस AI स्टेशन','Fast Launch Station →':'स्टेशन तुरंत खोलें →','Skip to content':'सीधे सामग्री पर जाएँ',
 'Connect camera to initiate live study observations.':'लाइव अवलोकन के लिए कैमरा जोड़ें।','Activate optical sensor to begin':'शुरू करने के लिए कैमरा चालू करें'
};
const AVATAR_HI = {
 goku:{good:['पोस्चर पावर 9000 से ऊपर! ऐसे ही रहो!','तुम्हारी रीढ़ सच्चे सायान जैसी सीधी है!','सीधे बैठने का अल्ट्रा इंस्टिंक्ट!'],bad:['काकारोट, पोस्चर गिर रहा है! सीधे बैठो!','झुककर सुपर सायान नहीं बनते! रीढ़ सीधी!','वेजीटा भी इससे सीधा बैठता है!']},
 gojo:{good:['डोमेन एक्सपेंशन: परफेक्ट अलाइनमेंट! शानदार पोस्चर!','सिक्स आइज़ ने पास किया। तुम सबसे बढ़िया बैठने वाले हो!','इस पोस्चर के साथ तुम पहले ही बेस्ट हो!'],bad:['मेरी सिक्स आइज़ तुम्हारा हर डिग्री का झुकाव देख रही हैं!','थोड़ा सीधे हो जाओ, फिर हम बराबर होंगे!','सीधे बैठो, चलो!']},
 shinchan:{good:['हे हे! मैं सीधा बैठा हूँ, आज मम्मी नहीं मारेंगी!','एक्शन कमेन गिरी पोज़! सीधा और तैयार!','मम्मी देखो, मेरा पोस्चर परफेक्ट है! एक्स्ट्रा स्नैक्स मिलेंगे?'],bad:['अरे नहीं! मम्मी आ रही हैं!','आउच! मेरी पीठ टेढ़ी हो रही है!','झुकता रहा तो शिरो भी मुझसे सीधा बैठेगा!']},
 student:{good:['रीढ़ सीधी, कंधे ढीले — पढ़ाई मोड चालू!','बहुत बढ़िया बैठे! तुम्हारी पीठ शुक्रिया कह रही है।','सीधा पोस्चर, तेज़ दिमाग!'],bad:['उफ़्फ़, मेरे बाल और पीठ दोनों बिखरे हैं! सीधे बैठो!','झुकने की चेतावनी! कंधे पीछे करो।','गहरी साँस लो, सीना ऊपर करो और दोबारा सीधे बैठो।']}
};
const TIPS_HI = ['पीठ कुर्सी से टिकाकर बैठो और पैर ज़मीन पर रखो।','हर 20 मिनट में 20 सेकंड के लिए दूर देखो।','स्क्रीन हाथ भर की दूरी पर रखो।','थोड़ी-थोड़ी देर में पानी पीते रहो।','हर 25 मिनट के बाद खड़े होकर थोड़ा स्ट्रेच करो।'];
const GREET_HI = {'Good morning':'शुभ प्रभात','Good afternoon':'नमस्कार','Good evening':'शुभ संध्या'};

let LANG = localStorage.getItem('wa_lang') || 'en';
const ORIG = new WeakMap();
function trText(s){
    const t = s.trim(); if(!t) return null;
    if(HI[t]) return s.replace(t, HI[t]);
    const m = t.match(/^(Good morning|Good afternoon|Good evening), (.+)$/);
    if(m) return s.replace(t, `${GREET_HI[m[1]]}, ${HI[m[2]] || m[2]}`);
    return null;
}
function walk(root){
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode?.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while(w.nextNode()) nodes.push(w.currentNode); return nodes;
}
function applyLang(root = document.body){
    OBS.disconnect();
    walk(root).forEach(n => {
        if(LANG === 'hi'){
            const r = trText(n.nodeValue);
            if(r !== null && r !== n.nodeValue){ ORIG.set(n, n.nodeValue); n.nodeValue = r; }
        } else if(ORIG.has(n)){ n.nodeValue = ORIG.get(n); ORIG.delete(n); }
    });
    document.documentElement.lang = LANG === 'hi' ? 'hi' : 'en';
    const b = $('langToggleBtn'); if(b) b.textContent = LANG === 'hi' ? 'EN' : 'हिं';
    watch();
}
function getAvatarLines(char, state){ return LANG === 'hi' ? AVATAR_HI[char]?.[state] : null; }
function getTips(){ return LANG === 'hi' && S.ageProfile === 'school' ? TIPS_HI : null; }
$('langToggleBtn')?.addEventListener('click', () => {
    LANG = LANG === 'hi' ? 'en' : 'hi'; localStorage.setItem('wa_lang', LANG);
    applyLang(); if(typeof setGreeting==='function') setGreeting(); applyLang(); _lastAvatarKey=''; triggerAvatarUpdate();
});
// keep JS-generated text translated (observer is paused while we edit, so no feedback loop)
const OBS = new MutationObserver(muts => {
    if(LANG !== 'hi') return;
    const roots = new Set();
    muts.forEach(m => { if(m.type === 'characterData') roots.add(m.target.parentNode || document.body); else m.addedNodes.forEach(n => roots.add(n.nodeType === 1 ? n : (n.parentNode || document.body))); });
    roots.forEach(r => applyLang(r));
});
function watch(){ if(LANG === 'hi') OBS.observe(document.body, { childList:true, characterData:true, subtree:true }); }
applyLang();
