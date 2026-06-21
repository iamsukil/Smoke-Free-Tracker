// ==============================
// dashboard.js — Dashboard + Live Quit Time Counter
// ==============================

const token = localStorage.getItem('jwt');
if (!token) window.location.href = '/index.html';

function logout() { localStorage.clear(); window.location.href = '/index.html'; }
function authHeaders() { return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }; }
function showEl(id)  { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id)  { document.getElementById(id).classList.add('hidden'); }

// ─── Sidebar user ──────────────────────────────────────────────────────────
const storedName = localStorage.getItem('userName') || 'User';
document.getElementById('sidebar-name').textContent = storedName;
document.getElementById('sidebar-avatar').textContent = storedName.charAt(0).toUpperCase();

// ─── Custom AM/PM Time Picker ──────────────────────────────────────────────────────
/**
 * Populate hour (01–12) and minute (00–59) selects, then default to
 * the browser’s current local time so the picker always looks live.
 * Called once at page load BEFORE loadProfile() so the options exist
 * when setTimePicker() tries to set their values.
 */
function initTimePicker() {
    const hourSel = document.getElementById('tp-hour');
    const minSel  = document.getElementById('tp-minute');
    for (let h = 1; h <= 12; h++) {
        const o = document.createElement('option');
        o.value = String(h).padStart(2, '0');
        o.textContent = String(h).padStart(2, '0');
        hourSel.appendChild(o);
    }
    for (let m = 0; m < 60; m++) {
        const o = document.createElement('option');
        o.value = String(m).padStart(2, '0');
        o.textContent = String(m).padStart(2, '0');
        minSel.appendChild(o);
    }
    // Default display to current local time
    const now = new Date();
    setTimePicker(
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
    );
}

/**
 * Read the three picker controls and return an unambiguous 24-hour "HH:MM" string.
 * This is what gets sent to the backend — no AM/PM ambiguity possible.
 */
function get24HourTime() {
    const h    = parseInt(document.getElementById('tp-hour').value, 10);
    const m    = document.getElementById('tp-minute').value;
    const isAm = document.getElementById('ampm-am').classList.contains('active');
    let h24;
    if (isAm) {
        h24 = (h === 12) ? 0 : h;          // 12 AM → 00, others as-is
    } else {
        h24 = (h === 12) ? 12 : h + 12;    // 12 PM → 12, 1 PM → 13 … 11 PM → 23
    }
    return String(h24).padStart(2, '0') + ':' + m;
}

/**
 * Restore the picker from a 24-hour "HH:MM" string (e.g. "13:52" from the backend).
 * Correctly maps 13:52 → 01:52 PM, 00:30 → 12:30 AM, etc.
 */
function setTimePicker(hh24) {
    if (!hh24 || !hh24.includes(':')) return;
    const [hStr, mStr] = hh24.split(':');
    const h24   = parseInt(hStr, 10);
    const minute = mStr.substring(0, 2);
    const isAm  = h24 < 12;
    let h12     = h24 % 12;
    if (h12 === 0) h12 = 12;  // midnight (0) and noon (12) both display as 12
    document.getElementById('tp-hour').value   = String(h12).padStart(2, '0');
    document.getElementById('tp-minute').value = minute;
    setAmPm(isAm ? 'AM' : 'PM');
}

/** Toggle the AM/PM highlight button */
function setAmPm(period) {
    document.getElementById('ampm-am').classList.toggle('active', period === 'AM');
    document.getElementById('ampm-pm').classList.toggle('active', period === 'PM');
}

// ─── Quit Time Counter ─────────────────────────────────────────────────────
let quitTimerInterval = null;
let quitDateTimeGlobal = null; // ISO datetime string "YYYY-MM-DDTHH:MM:SS"

function startQuitTimer(quitDate, quitTime) {
    if (!quitDate) return;
    // Combine date + time. The HTML <input type="time"> always returns 24-hour HH:MM,
    // and the backend stores/returns local wall-clock time with no timezone offset.
    // Constructing "YYYY-MM-DDTHH:MM:SS" (no "Z") makes new Date() treat it as
    // local time — which is exactly what we want.
    const timeStr = quitTime || '00:00:00';
    quitDateTimeGlobal = quitDate + 'T' + (timeStr.length === 5 ? timeStr + ':00' : timeStr);
    console.log('[startQuitTimer] quitDateTimeGlobal =', quitDateTimeGlobal);
    console.log('[startQuitTimer] parsed as Date =', new Date(quitDateTimeGlobal).toString());
    console.log('[startQuitTimer] current time   =', new Date().toString());

    if (quitTimerInterval) clearInterval(quitTimerInterval);
    updateQuitTimer();
    quitTimerInterval = setInterval(updateQuitTimer, 1000);
}

function updateQuitTimer() {
    if (!quitDateTimeGlobal) return;

    const quitDT     = new Date(quitDateTimeGlobal);
    const now        = new Date();
    const diffMs     = now - quitDT;

    // Log once per minute to avoid console spam (when seconds === 0)
    if (now.getSeconds() === 0) {
        console.log('[updateQuitTimer] quitDT =', quitDT.toString(),
                    '| now =', now.toString(),
                    '| diffMs =', diffMs);
    }

    if (diffMs < 0) {
        // Quit date/time is in the future
        setQuitTimerDisplay('00', '00', '00', '00');
        return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setQuitTimerDisplay(
        String(days),
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    );
}

function setQuitTimerDisplay(d, h, m, s) {
    const dEl = document.getElementById('qt-days');
    const hEl = document.getElementById('qt-hours');
    const mEl = document.getElementById('qt-minutes');
    const sEl = document.getElementById('qt-seconds');
    if (dEl) dEl.textContent = d;
    if (hEl) hEl.textContent = h;
    if (mEl) mEl.textContent = m;
    if (sEl) sEl.textContent = s;
}

// ─── Animated count-up ─────────────────────────────────────────────────────
function animateCount(el, target, prefix = '', suffix = '', decimals = 0) {
    const duration = 1200;
    const start    = performance.now();
    function update(time) {
        const elapsed = Math.min((time - start) / duration, 1);
        const eased   = 1 - Math.pow(1 - elapsed, 3);
        const current = target * eased;
        el.textContent = prefix + current.toFixed(decimals) + suffix;
        if (elapsed < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ─── Load Profile (prefills form + starts timer) ──────────────────────────────
async function loadProfile() {
    try {
        const res = await fetch('/api/user/profile', { headers: authHeaders() });
        if (!res.ok) {
            console.warn('[loadProfile] API returned', res.status);
            return;
        }
        const p = await res.json();
        console.log('[loadProfile] Raw API response:', JSON.stringify(p));

        if (p.quitDate) {
            // Backend returns full ISO-8601 local datetime, e.g. "2026-06-15T13:52:00".
            // Split on "T" to get the date and 24-hour time parts separately.
            const hasTime  = p.quitDate.includes('T');
            const datePart = hasTime ? p.quitDate.split('T')[0] : p.quitDate;
            const timePart = hasTime ? p.quitDate.split('T')[1].substring(0, 5) : '12:00'; // HH:MM 24-hr
            console.log('[loadProfile] Parsed → date:', datePart, ' time(24h):', timePart);

            document.getElementById('upd-quit-date').value = datePart;
            document.getElementById('upd-cigs').value = p.cigsPerDay        || '';
            document.getElementById('upd-cost').value = p.costPerCigarette  || '';

            // ── FIX: Defer setTimePicker so it runs AFTER the browser's own
            //    form-restore (which fires after DOMContentLoaded / script execution).
            //    On F5 / Ctrl+Shift+R, many browsers re-apply cached <select> values
            //    asynchronously, clobbering any values JS set synchronously.
            //    Using setTimeout(…, 0) pushes our setter to the next microtask,
            //    guaranteeing it runs LAST and "wins" over browser autofill.
            setTimeout(() => {
                console.log('[loadProfile] Setting time picker to:', timePart);
                setTimePicker(timePart);
                // Verify the values actually stuck
                console.log('[loadProfile] After setTimePicker → hour:',
                    document.getElementById('tp-hour').value,
                    'minute:', document.getElementById('tp-minute').value,
                    'AM active:', document.getElementById('ampm-am').classList.contains('active'),
                    'PM active:', document.getElementById('ampm-pm').classList.contains('active'));
            }, 0);

            startQuitTimer(datePart, timePart);
        } else {
            console.log('[loadProfile] No quitDate found — showing setup banner');
            document.getElementById('upd-cigs').value = p.cigsPerDay        || '';
            document.getElementById('upd-cost').value = p.costPerCigarette  || '';
            showEl('setup-banner');
        }
    } catch (err) {
        console.warn('Profile load failed:', err);
    }
}

// ─── Load Stats ─────────────────────────────────────────────────────────────
async function loadStats() {
    hideEl('stats-container');
    hideEl('error-state');
    showEl('loading');

    try {
        const res = await fetch('/api/progress/stats', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();

        hideEl('loading');
        showEl('stats-container');

        // Animate stat cards (₹ currency)
        animateCount(document.getElementById('stat-days'),  data.daysFree              || 0);
        animateCount(document.getElementById('stat-cigs'),  data.cigarettesAvoided     || 0);
        animateCount(document.getElementById('stat-money'), data.moneySaved             || 0, '₹', '', 2);
        animateCount(document.getElementById('stat-life'),  data.minutesOfLifeRegained  || 0);

        // Progress bars
        const achUnlocked = data.achievementsUnlocked || 0;
        const achTotal    = data.totalAchievements    || 1;
        const msReached   = data.milestonesReached    || 0;
        const msTotal     = data.totalMilestones      || 1;

        document.getElementById('ach-count').textContent = `${achUnlocked}/${achTotal}`;
        document.getElementById('ms-count').textContent  = `${msReached}/${msTotal}`;
        document.getElementById('ach-bar').style.width   = `${(achUnlocked / achTotal) * 100}%`;
        document.getElementById('ms-bar').style.width    = `${(msReached  / msTotal)  * 100}%`;

        // PWA Notifications
        const prevAch = parseInt(sessionStorage.getItem('pwa-ach') || '0');
        const prevMs  = parseInt(sessionStorage.getItem('pwa-ms')  || '0');
        if (window.pwa) {
            if (achUnlocked > prevAch) {
                window.pwa.sendNotification(
                  '🏆 Achievement Unlocked!',
                  `You've earned ${achUnlocked} achievement${achUnlocked !== 1 ? 's' : ''}. Keep it up!`,
                  '/achievements.html'
                );
            }
            if (msReached > prevMs) {
                window.pwa.sendNotification(
                  '❤️ Health Milestone Reached!',
                  `Your body has reached ${msReached} health milestone${msReached !== 1 ? 's' : ''}. Amazing!`,
                  '/health.html'
                );
            }
            const money = data.moneySaved || 0;
            const prevMoney = parseFloat(sessionStorage.getItem('pwa-money') || '0');
            const moneyThreshold = Math.floor(money / 500) * 500;
            const prevThreshold  = Math.floor(prevMoney / 500) * 500;
            if (moneyThreshold > prevThreshold && moneyThreshold > 0) {
                window.pwa.sendNotification(
                  '💰 Money Milestone!',
                  `You've saved ₹${moneyThreshold} by staying smoke-free! Incredible!`,
                  '/progress.html'
                );
            }
            sessionStorage.setItem('pwa-money', String(money));
        }
        sessionStorage.setItem('pwa-ach', String(achUnlocked));
        sessionStorage.setItem('pwa-ms',  String(msReached));

        // Days message
        const days = data.daysFree || 0;
        let msg = 'Keep going — every minute matters. 💪';
        if (days >= 365) msg = `🎉 Over a YEAR smoke-free! You are legendary!`;
        else if (days >= 30) msg = `💪 ${days} days and counting — you are incredible!`;
        else if (days >= 7)  msg = `🌟 A full week done! You are on fire!`;
        else if (days >= 1)  msg = `✨ ${days} day(s) strong! Keep it up!`;
        document.getElementById('days-message').textContent = msg;
        if (days >= 3) showEl('streak-badge');

    } catch (err) {
        hideEl('loading');
        showEl('error-state');
        console.error(err);
    }
}

// ─── Update Quit Info ────────────────────────────────────────────────────────────
async function updateQuitInfo() {
    const quitDate         = document.getElementById('upd-quit-date').value;
    // get24HourTime() reads the explicit Hour / Minute / AM-PM selects and returns
    // a 24-hour "HH:MM" string — e.g. selecting 1:52 PM reliably gives "13:52".
    const quitTime         = get24HourTime();
    const cigsPerDay       = document.getElementById('upd-cigs').value;
    const costPerCigarette = document.getElementById('upd-cost').value;

    console.log('[updateQuitInfo] Saving → date:', quitDate, ' time(24h):', quitTime,
                ' cigs:', cigsPerDay, ' cost:', costPerCigarette);

    if (!quitDate) { showUpdateAlert('Please set a quit date.', 'danger'); return; }

    try {
        const res = await fetch('/api/user/quit-date', {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                quitDate,
                quitTime,
                cigsPerDay:       cigsPerDay.toString(),
                costPerCigarette: costPerCigarette.toString()
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('[updateQuitInfo] Save successful:', data.message);
            showUpdateAlert('✅ ' + data.message, 'success');
            hideEl('setup-banner');
            startQuitTimer(quitDate, quitTime);
            setTimeout(loadStats, 600);
        } else {
            showUpdateAlert('❌ ' + (data.error || 'Update failed'), 'danger');
        }
    } catch {
        showUpdateAlert('Network error.', 'danger');
    }
}

function showUpdateAlert(msg, type) {
    const el = document.getElementById('update-alert');
    el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => el.innerHTML = '', 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
initTimePicker(); // MUST run first: populates <select> options before loadProfile()
loadProfile();     // fetches saved time → calls setTimePicker() to restore picker
loadStats();
