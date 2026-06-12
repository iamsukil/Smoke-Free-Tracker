// ==============================
// progress.js — Overall Progress Page
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

// Colour classes for bar fills
const PERIOD_CONFIG = [
    { key: 'PerDay',   label: 'Per Day',   barColor: 'rgba(108,99,255,0.7)',  width: 25  },
    { key: 'PerWeek',  label: 'Per Week',  barColor: 'rgba(108,99,255,0.8)',  width: 50  },
    { key: 'PerMonth', label: 'Per Month', barColor: 'rgba(168,85,247,0.85)', width: 75  },
    { key: 'PerYear',  label: 'Per Year',  barColor: 'rgba(168,85,247,1)',    width: 100 },
];

// Build one breakdown table
function buildTable(containerId, rows) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    rows.forEach(({ period, main, sub, barColor, barWidth }) => {
        const row = document.createElement('div');
        row.className = 'progress-row';
        row.innerHTML = `
            <div class="progress-period">${period}</div>
            <div class="progress-value-row">
              <div>
                <div class="progress-number ${getColorClass(containerId)}">${main}</div>
                ${sub ? `<div class="progress-sub">${sub}</div>` : ''}
              </div>
              <div class="progress-bar-mini">
                <div class="progress-bar-mini-fill"
                     data-width="${barWidth}%"
                     style="background:${barColor};"></div>
              </div>
            </div>`;
        el.appendChild(row);
    });

    // Animate bars after render
    requestAnimationFrame(() => {
        el.querySelectorAll('.progress-bar-mini-fill').forEach(b => {
            b.style.width = b.dataset.width;
        });
    });
}

function getColorClass(containerId) {
    if (containerId === 'cigs-table')  return 'purple';
    if (containerId === 'money-table') return 'green';
    return 'warm';
}

async function loadOverall() {
    showEl('loading');
    hideEl('content');

    try {
        const res = await fetch('/api/progress/overall', { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load overall progress');
        const d = await res.json();

        hideEl('loading');
        showEl('content');

        // Hero cards
        document.getElementById('hero-cigs').textContent  = d.cigsPerYear  ?? '—';
        document.getElementById('hero-money').textContent = d.moneyPerYear != null
            ? `₹${d.moneyPerYear.toFixed(2)}` : '—';
        document.getElementById('hero-time').textContent  = d.timePerYear  ?? '—';

        // Cigarettes table
        buildTable('cigs-table', [
            { period: 'Per Day',   main: d.cigsPerDay,   barColor: PERIOD_CONFIG[0].barColor, barWidth: 25  },
            { period: 'Per Week',  main: d.cigsPerWeek,  barColor: PERIOD_CONFIG[1].barColor, barWidth: 50  },
            { period: 'Per Month', main: d.cigsPerMonth, barColor: PERIOD_CONFIG[2].barColor, barWidth: 75  },
            { period: 'Per Year',  main: d.cigsPerYear,  barColor: PERIOD_CONFIG[3].barColor, barWidth: 100 },
        ]);

        // Money table
        buildTable('money-table', [
            { period: 'Per Day',   main: `₹${(d.moneyPerDay   ?? 0).toFixed(2)}`, barColor: 'rgba(16,185,129,0.5)',  barWidth: 25  },
            { period: 'Per Week',  main: `₹${(d.moneyPerWeek  ?? 0).toFixed(2)}`, barColor: 'rgba(16,185,129,0.65)', barWidth: 50  },
            { period: 'Per Month', main: `₹${(d.moneyPerMonth ?? 0).toFixed(2)}`, barColor: 'rgba(16,185,129,0.8)',  barWidth: 75  },
            { period: 'Per Year',  main: `₹${(d.moneyPerYear  ?? 0).toFixed(2)}`, barColor: 'rgba(16,185,129,1)',    barWidth: 100 },
        ]);

        // Time table
        buildTable('time-table', [
            { period: 'Per Day',   main: d.timePerDay,   sub: `(${d.rawMinPerDay   ?? 0} min)`, barColor: 'rgba(245,158,11,0.5)',  barWidth: 25  },
            { period: 'Per Week',  main: d.timePerWeek,  sub: `(${d.rawMinPerWeek  ?? 0} min)`, barColor: 'rgba(245,158,11,0.65)', barWidth: 50  },
            { period: 'Per Month', main: d.timePerMonth, sub: `(${d.rawMinPerMonth ?? 0} min)`, barColor: 'rgba(245,158,11,0.8)',  barWidth: 75  },
            { period: 'Per Year',  main: d.timePerYear,  sub: `(${d.rawMinPerYear  ?? 0} min)`, barColor: 'rgba(245,158,11,1)',    barWidth: 100 },
        ]);

    } catch (err) {
        hideEl('loading');
        console.error(err);
        document.getElementById('content').innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">⚠️</div>
              <h3>Could not load progress</h3>
              <p>Make sure you've set your quit date and cigarette details in the <a href="/dashboard.html" style="color:var(--accent-primary);">Dashboard</a>.</p>
            </div>`;
        showEl('content');
    }
}

loadOverall();
