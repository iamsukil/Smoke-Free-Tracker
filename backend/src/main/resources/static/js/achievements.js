// ==============================
// achievements.js — Badge Grid
// ==============================

const token = localStorage.getItem('jwt');
if (!token) window.location.href = '/index.html';

function logout() { localStorage.clear(); window.location.href = '/index.html'; }
function authHeaders() { return { 'Authorization': 'Bearer ' + token }; }
function showEl(id)  { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id)  { document.getElementById(id).classList.add('hidden'); }

// Sidebar
const storedName = localStorage.getItem('userName') || 'User';
document.getElementById('sidebar-name').textContent = storedName;
document.getElementById('sidebar-avatar').textContent = storedName.charAt(0).toUpperCase();

// Badge metadata
const BADGE_META = {
  'First Day':    { emoji: '🌟', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  'One Week':     { emoji: '🔥', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  'Two Weeks':    { emoji: '💪', gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)' },
  'One Month':    { emoji: '🏅', gradient: 'linear-gradient(135deg,#10b981,#14b8a6)' },
  'Three Months': { emoji: '🥈', gradient: 'linear-gradient(135deg,#6c63ff,#14b8a6)' },
  'Six Months':   { emoji: '🥇', gradient: 'linear-gradient(135deg,#f59e0b,#10b981)' },
  'One Year':     { emoji: '🏆', gradient: 'linear-gradient(135deg,#f59e0b,#a855f7)' },
  'Two Years':    { emoji: '👑', gradient: 'linear-gradient(135deg,#a855f7,#ec4899)' },
  'Five Years':   { emoji: '💎', gradient: 'linear-gradient(135deg,#14b8a6,#6c63ff)' }
};

async function loadAchievements() {
  showEl('loading');
  hideEl('achievements-grid');
  hideEl('empty-state');

  try {
    const res = await fetch('/api/achievements', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const achievements = await res.json();

    hideEl('loading');

    if (!achievements.length) {
      showEl('empty-state');
      return;
    }

    const unlocked = achievements.filter(a => a.isUnlocked).length;
    const total    = achievements.length;

    // Update header
    document.getElementById('unlocked-count').textContent = `${unlocked} Unlocked`;
    document.getElementById('progress-text').textContent  = `${unlocked} / ${total}`;
    document.getElementById('ach-progress-bar').style.width = `${(unlocked / total) * 100}%`;

    // Render grid
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';

    achievements.forEach(a => {
      const meta = BADGE_META[a.badgeName] || { emoji: '🎖️', gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)' };
      const card = document.createElement('div');
      card.className = `achievement-card ${a.isUnlocked ? 'unlocked' : 'locked'}`;
      card.title     = a.isUnlocked
        ? `Unlocked: ${new Date(a.unlockedAt).toLocaleDateString()}`
        : `Requires ${a.daysRequired} days smoke-free`;

      card.innerHTML = `
        <div style="width:64px;height:64px;border-radius:18px;
             background:${a.isUnlocked ? meta.gradient : 'rgba(255,255,255,0.06)'};
             display:flex;align-items:center;justify-content:center;
             margin:0 auto 14px;font-size:32px;
             box-shadow:${a.isUnlocked ? '0 4px 20px rgba(108,99,255,0.3)' : 'none'};
             transition:all 0.3s ease;">
          ${meta.emoji}
        </div>
        <div class="achievement-name">${a.badgeName}</div>
        <div class="achievement-desc">${a.description}</div>
        <div class="achievement-days">${a.isUnlocked ? '✅ Unlocked!' : `🔒 ${a.daysRequired} days`}</div>
        ${a.isUnlocked
          ? `<div class="badge badge-success mt-1" style="margin:10px auto 0;display:inline-flex;">
               ${new Date(a.unlockedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
             </div>`
          : ''}
      `;
      grid.appendChild(card);
    });

    showEl('achievements-grid');

  } catch (err) {
    hideEl('loading');
    console.error(err);
  }
}

loadAchievements();
