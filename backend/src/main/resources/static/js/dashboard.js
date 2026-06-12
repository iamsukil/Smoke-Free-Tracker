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

// ─── Quit Time Counter ─────────────────────────────────────────────────────
let quitTimerInterval = null;
let quitDateTimeGlobal = null; // ISO datetime string "YYYY-MM-DDTHH:MM:SS"

function startQuitTimer(quitDate, quitTime) {
    if (!quitDate) return;
    // Combine date + time (default to midnight if no time set)
    const timeStr = quitTime || '00:00:00';
    quitDateTimeGlobal = quitDate + 'T' + (timeStr.length === 5 ? timeStr + ':00' : timeStr);

    if (quitTimerInterval) clearInterval(quitTimerInterval);
    updateQuitTimer();
    quitTimerInterval = setInterval(updateQuitTimer, 1000);
}

function updateQuitTimer() {
    if (!quitDateTimeGlobal) return;

    const quitDT     = new Date(quitDateTimeGlobal);
    const now        = new Date();
    const diffMs     = now - quitDT;

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

// ─── Load Profile (prefills form + starts timer) ───────────────────────────
async function loadProfile() {
    try {
        const res = await fetch('/api/user/profile', { headers: authHeaders() });
        if (!res.ok) return;
        const p = await res.json();

        // Pre-fill update form
        document.getElementById('upd-quit-date').value = p.quitDate   || '';
        document.getElementById('upd-cigs').value      = p.cigsPerDay  || '';
        document.getElementById('upd-cost').value      = p.costPerPack || '';

        // Extract time from quitDate if it has a time component (ISO 8601)
        // Otherwise default to 00:00
        if (p.quitDate) {
            const hasTime = p.quitDate.includes('T');
            if (hasTime) {
                const timePart = p.quitDate.split('T')[1].substring(0, 5);
                document.getElementById('upd-quit-time').value = timePart;
                startQuitTimer(p.quitDate.split('T')[0], timePart);
            } else {
                document.getElementById('upd-quit-time').value = '00:00';
                startQuitTimer(p.quitDate, '00:00');
            }
        } else {
            // No quit date yet — show setup banner
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

// ─── Update Quit Info ────────────────────────────────────────────────────────
async function updateQuitInfo() {
    const quitDate    = document.getElementById('upd-quit-date').value;
    const quitTime    = document.getElementById('upd-quit-time').value || '00:00';
    const cigsPerDay  = document.getElementById('upd-cigs').value;
    const costPerPack = document.getElementById('upd-cost').value;

    if (!quitDate) { showUpdateAlert('Please set a quit date.', 'danger'); return; }

    try {
        const res = await fetch('/api/user/quit-date', {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                quitDate,
                quitTime,
                cigsPerDay: cigsPerDay.toString(),
                costPerPack: costPerPack.toString()
            })
        });
        const data = await res.json();
        if (res.ok) {
            showUpdateAlert('✅ ' + data.message, 'success');
            // Hide setup banner since user has now set their info
            hideEl('setup-banner');
            // Restart timer with new date + time
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

// ─── Init ─────────────────────────────────────────────────────────────────
loadProfile(); // starts timer + prefills form
loadStats();
