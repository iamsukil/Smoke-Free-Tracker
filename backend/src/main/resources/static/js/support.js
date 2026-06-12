// ==============================
// support.js — Support / Quit Lines (static page)
// ==============================

// Redirect to login if not authenticated (optional — page is mostly static)
const token = localStorage.getItem('jwt');

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

// Sidebar user info
const storedName = localStorage.getItem('userName') || 'User';
const nameEl   = document.getElementById('sidebar-name');
const avatarEl = document.getElementById('sidebar-avatar');
if (nameEl)   nameEl.textContent   = storedName;
if (avatarEl) avatarEl.textContent = storedName.charAt(0).toUpperCase();

// Track call clicks (just a small analytics hook — can be extended)
function trackCall(number) {
    console.info(`User initiated call to: ${number}`);
}
