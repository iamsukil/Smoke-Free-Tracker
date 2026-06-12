// ==============================
// cravings.js — Cravings Tracker
// ==============================

const token = localStorage.getItem('jwt');
if (!token) window.location.href = '/index.html';

function logout() { localStorage.clear(); window.location.href = '/index.html'; }
function authHeaders() { return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }; }
function showEl(id)  { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id)  { document.getElementById(id).classList.add('hidden'); }

// Sidebar
const storedName = localStorage.getItem('userName') || 'User';
document.getElementById('sidebar-name').textContent = storedName;
document.getElementById('sidebar-avatar').textContent = storedName.charAt(0).toUpperCase();

let cravingChart = null;

// Build intensity colour bar (10 segments)
function buildIntensityBar(value) {
  const bar = document.getElementById('intensity-bar');
  bar.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const seg = document.createElement('div');
    seg.className = 'intensity-segment';
    if (i <= value) {
      if (value <= 3)       seg.classList.add('active-low');
      else if (value <= 6)  seg.classList.add('active-mid');
      else                  seg.classList.add('active-high');
    }
    bar.appendChild(seg);
  }
}

function updateIntensity(value) {
  const display = document.getElementById('intensity-display');
  display.textContent = value;

  // Colour the number
  const v = parseInt(value);
  if (v <= 3)      display.style.color = 'var(--accent-green)';
  else if (v <= 6) display.style.color = 'var(--accent-orange)';
  else             display.style.color = 'var(--accent-red)';

  buildIntensityBar(v);
}

// Init slider
buildIntensityBar(5);

// ===== Log Craving =====
document.getElementById('craving-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn       = document.getElementById('log-btn');
  const intensity = parseInt(document.getElementById('intensity-slider').value);
  const trigger   = document.getElementById('trigger-select').value;
  clearAlert();

  btn.disabled = true;
  btn.textContent = 'Logging...';

  try {
    const res = await fetch('/api/cravings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ intensity, trigger })
    });
    const data = await res.json();

    if (res.ok) {
      showAlert('💪 ' + data.message, 'success');
      loadHistory();
    } else {
      showAlert('❌ ' + (data.error || 'Failed to log craving.'), 'danger');
    }
  } catch {
    showAlert('Network error.', 'danger');
  }

  btn.disabled = false;
  btn.textContent = 'Log Craving — You\'ve Got This! 💪';
});

function showAlert(msg, type) {
  const el = document.getElementById('craving-alert');
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => el.innerHTML = '', 4000);
}
function clearAlert() {
  document.getElementById('craving-alert').innerHTML = '';
}

// ===== Load History =====
async function loadHistory() {
  document.getElementById('recent-logs-loading').style.display = 'flex';
  hideEl('recent-logs');
  hideEl('recent-empty');

  try {
    const res = await fetch('/api/cravings/history', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();

    document.getElementById('recent-logs-loading').style.display = 'none';

    // Total badge
    document.getElementById('total-count').textContent = `${data.totalCravings || 0} total`;

    // Chart
    renderChart(data.labels || [], data.counts || [], data.avgIntensities || []);

    // Recent logs
    const recentLogs = data.recentLogs || [];
    if (recentLogs.length === 0) {
      showEl('recent-empty');
      return;
    }

    const container = document.getElementById('recent-logs');
    container.innerHTML = '';

    recentLogs.forEach(log => {
      const v = log.intensity;
      let color = 'var(--accent-green)';
      if (v > 6)      color = 'var(--accent-red)';
      else if (v > 3) color = 'var(--accent-orange)';

      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);
               display:flex;align-items:center;justify-content:center;
               font-size:14px;font-weight:800;color:${color};">${v}</div>
          <div>
            <div style="font-size:13px;font-weight:600;">${log.trigger}</div>
            <div style="font-size:11px;color:var(--text-muted);">
              ${new Date(log.loggedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:3px;">
          ${Array.from({length:10},(_,i)=>`<div style="width:5px;height:14px;border-radius:2px;
            background:${i<v?color:'rgba(255,255,255,0.08)'};"></div>`).join('')}
        </div>`;
      container.appendChild(item);
    });

    showEl('recent-logs');

  } catch (err) {
    document.getElementById('recent-logs-loading').style.display = 'none';
    console.error(err);
  }
}

function renderChart(labels, counts, avgIntensities) {
  const ctx = document.getElementById('cravings-chart').getContext('2d');

  if (cravingChart) {
    cravingChart.destroy();
    cravingChart = null;
  }

  if (!labels.length) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet — log your first craving!', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  cravingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Number of Cravings',
          data: counts,
          backgroundColor: 'rgba(108, 99, 255, 0.6)',
          borderColor: 'rgba(108, 99, 255, 1)',
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Avg Intensity',
          data: avgIntensities,
          type: 'line',
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 4,
          tension: 0.4,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'rgba(240,244,255,0.7)', font: { family: 'Inter', size: 12 } }
        },
        tooltip: {
          backgroundColor: 'rgba(15,22,40,0.95)',
          titleColor: '#f0f4ff',
          bodyColor: 'rgba(240,244,255,0.7)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(240,244,255,0.5)', font: { size: 11 } },
          grid:  { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          type: 'linear',
          position: 'left',
          ticks: { color: 'rgba(240,244,255,0.5)', font: { size: 11 }, precision: 0 },
          grid:  { color: 'rgba(255,255,255,0.04)' },
          title: { display: true, text: 'Count', color: 'rgba(240,244,255,0.4)', font: { size: 11 } }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 10,
          ticks: { color: 'rgba(245,158,11,0.7)', font: { size: 11 } },
          grid:  { drawOnChartArea: false },
          title: { display: true, text: 'Intensity', color: 'rgba(245,158,11,0.6)', font: { size: 11 } }
        }
      }
    }
  });
}

// Init
loadHistory();
