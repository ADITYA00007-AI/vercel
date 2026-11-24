'use strict';
// ============================================================
// SESSION LOG EXPORT · STUDENT DETAILS · CONSENT · MODAL KEYS
// ============================================================
const LOG_KEY = 'wa_session_log';
function readLog(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY)||'[]'); }catch(e){ return []; } }
function logSession(text, pts){
    try{
        const log = readLog();
        log.push({ t: new Date().toISOString(), event: String(text), pts: String(pts||'') });
        localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-500)));
    }catch(e){}
}
function csvCell(v){ v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v; }
function exportSessionCsv(){
    const name = localStorage.getItem('wa_student_name') || '';
    const cls  = localStorage.getItem('wa_student_class') || '';
    const rows = [['Student','Class','Timestamp','Event','Points']];
    readLog().forEach(r => rows.push([name, cls, r.t, r.event, r.pts]));
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total points', S.points]);
    rows.push(['Day streak', S.streak]);
    rows.push(['Total move reps', S.totalReps]);
    rows.push(['Water today (ml)', S.waterMl]);
    const csv = '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    a.download = `wellness-session-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    showToast('check','CSV saved','Your session log was downloaded.');
}
function syncStudentFields(){
    const n = localStorage.getItem('wa_student_name') || '', c = localStorage.getItem('wa_student_class') || '';
    document.querySelectorAll('.js-student-name').forEach(i => { if(i !== document.activeElement) i.value = n; });
    document.querySelectorAll('.js-student-class').forEach(i => { if(i !== document.activeElement) i.value = c; });
}
document.querySelectorAll('.js-student-name').forEach(i => i.addEventListener('input', () => { localStorage.setItem('wa_student_name', i.value.trim()); syncStudentFields(); }));
document.querySelectorAll('.js-student-class').forEach(i => i.addEventListener('input', () => { localStorage.setItem('wa_student_class', i.value.trim()); syncStudentFields(); }));
$('btnExportCsv')?.addEventListener('click', exportSessionCsv);
$('btnClearLog')?.addEventListener('click', () => {
    if(!confirm('Delete your saved points, log, height and settings from this device?')) return;
    Object.keys(localStorage).filter(k => k.startsWith('wa_')).forEach(k => localStorage.removeItem(k));
    location.reload();
});
syncStudentFields();

// ---- Consent for school-age mode (asked once per browser session)
function needsConsent(){ return S.ageProfile === 'school' && sessionStorage.getItem('wa_consent') !== '1'; }
function showConsent(){ const m = $('consentModal'); if(m){ $('consentCheck').checked = false; $('consentContinueBtn').disabled = true; m.style.display = 'flex'; $('consentCheck').focus(); } }
$('consentCheck')?.addEventListener('change', e => { $('consentContinueBtn').disabled = !e.target.checked; });
$('consentCancelBtn')?.addEventListener('click', () => { $('consentModal').style.display = 'none'; });
$('consentContinueBtn')?.addEventListener('click', () => {
    sessionStorage.setItem('wa_consent','1'); $('consentModal').style.display = 'none'; openCameraModal();
});

// ---- Local-only badge when camera is live
setInterval(() => { const b = $('localOnlyBadge'); if(b) b.style.display = S.cameraReady ? 'inline' : 'none'; }, 1000);

// ---- Esc closes the top-most open dialog
document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    const open = [...document.querySelectorAll('.modal-overlay')].filter(m => m.style.display === 'flex');
    if(open.length) open[open.length-1].style.display = 'none';
});

// ---- Offline support
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
}
