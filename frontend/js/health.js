// ==============================
// health.js — Health Timeline with Progress Bars
// ==============================

const token = localStorage.getItem('jwt');
if (!token) window.location.href = '/index.html';

function logout() { localStorage.clear(); window.location.href = '/index.html'; }
function authHeaders() { return { 'Authorization': 'Bearer ' + token }; }
function showEl(id) { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id).classList.add('hidden'); }

// Sidebar
const storedName = localStorage.getItem('userName') || 'User';
document.getElementById('sidebar-name').textContent = storedName;
document.getElementById('sidebar-avatar').textContent = storedName.charAt(0).toUpperCase();

// Icon map for each milestone
const MILESTONE_ICONS = {
    'Heart rate and blood pressure return to normal':         '❤️',
    'Carbon monoxide level in blood drops to normal':         '💨',
    'Circulation improves and lung function increases':       '🫁',
    'Coughing and shortness of breath decrease':             '😮‍💨',
    'Risk of coronary heart disease is half that of a smoker':'💪',
    'Stroke risk same as a non-smoker':                      '🧠',
    'Lung cancer risk falls to half that of a smoker':       '🎗️',
    'Coronary heart disease risk same as a non-smoker':      '🏆'
};

function formatHours(h) {
    if (h < 1)           return `${Math.round(h * 60)} min`;
    if (h < 24)          return `${h} hr`;
    if (h < 720)         return `${Math.round(h / 24)} day${Math.round(h/24) !== 1 ? 's' : ''}`;
    if (h < 8760)        return `${Math.round(h / 720)} month${Math.round(h/720) !== 1 ? 's' : ''}`;
    return `${Math.round(h / 8760)} year${Math.round(h/8760) !== 1 ? 's' : ''}`;
}

async function loadMilestones() {
    showEl('loading');
    hideEl('timeline-container');

    try {
        const res = await fetch('/api/health/milestones', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        const milestones = await res.json();

        hideEl('loading');
        showEl('timeline-container');

        const reached = milestones.filter(m => m.isReached).length;
        const total   = milestones.length;

        document.getElementById('summary-reached').textContent = `${reached}/${total}`;
        document.getElementById('health-bar').style.width = total
            ? `${(reached / total) * 100}%` : '0%';

        // Emoji icon strip
        const iconsEl = document.getElementById('milestone-icons');
        iconsEl.innerHTML = '';
        milestones.forEach(m => {
            const icon = MILESTONE_ICONS[m.milestone] || '✨';
            const span = document.createElement('span');
            span.title = m.milestone;
            span.style.cssText = `font-size:22px;opacity:${m.isReached ? 1 : 0.25};
                filter:${m.isReached ? 'none' : 'grayscale(1)'};cursor:default;`;
            span.textContent = icon;
            iconsEl.appendChild(span);
        });

        // Render milestone cards with progress bars
        const listEl = document.getElementById('milestone-list');
        listEl.innerHTML = '';

        milestones.forEach(m => {
            const icon       = MILESTONE_ICONS[m.milestone] || '✨';
            const pct        = m.progressPct || 0;        // 0-100, from API
            const hoursFree  = Math.floor(m.hoursFree || 0);
            const isReached  = m.isReached;

            const card = document.createElement('div');
            card.className = `milestone-item ${isReached ? 'reached' : ''}`;

            // What to show on right side of bar
            const reachedLabel = isReached
                ? `<span class="badge badge-success" style="font-size:11px;">✅ Reached after ${formatHours(m.hoursRequired)}</span>`
                : `<span style="font-size:11px;color:var(--text-muted);">⏳ ${formatHours(m.hoursRemaining)} left</span>`;

            card.innerHTML = `
              <!-- Icon + label row -->
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <span style="font-size:24px;flex-shrink:0;">${icon}</span>
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:600;line-height:1.3;">${m.milestone}</div>
                  <div class="milestone-time-label">Required: ${formatHours(m.hoursRequired)}</div>
                </div>
                ${reachedLabel}
              </div>

              <!-- Progress bar row: left_num [===bar===] 100 chevron -->
              <div class="milestone-bar-row">
                <span class="milestone-bar-num">${pct}</span>
                <div class="milestone-bar-track">
                  <div class="milestone-bar-fill" data-width="${pct}%"></div>
                </div>
                <span class="milestone-bar-max">100</span>
                <div class="milestone-chevron ${isReached ? 'done' : 'pending'}">
                  ${isReached ? '✓' : '>'}
                </div>
              </div>`;

            listEl.appendChild(card);
        });

        // Animate progress bars after a short delay (triggers CSS transition)
        requestAnimationFrame(() => {
            document.querySelectorAll('.milestone-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        });

        // Next milestone banner
        loadNextMilestone();

    } catch (err) {
        hideEl('loading');
        console.error('Failed to load milestones:', err);
    }
}

async function loadNextMilestone() {
    try {
        const res  = await fetch('/api/health/milestones/next', { headers: authHeaders() });
        const data = await res.json();
        if (data.milestone) {
            document.getElementById('next-milestone-name').textContent = data.milestone;
            document.getElementById('next-milestone-time').textContent =
                `${formatHours(data.hoursRemaining)} until your next health milestone`;
            showEl('next-milestone-banner');
        }
    } catch {}
}

loadMilestones();
