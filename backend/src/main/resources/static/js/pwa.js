// ============================================================
// pwa.js — PWA helpers: SW registration, Install prompt,
//           Push notifications, Online/Offline indicator,
//           Mobile sidebar toggle
// ============================================================

// ── Mobile Sidebar Toggle (global — called from onclick in HTML) ────────────
window.toggleSidebar = function () {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('visible', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
};
window.closeSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar)  sidebar.classList.remove('open');
  if (overlay)  overlay.classList.remove('visible');
  document.body.style.overflow = '';
};
// Close sidebar when a nav link is clicked on mobile
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) window.closeSidebar();
    });
  });
});

(function () {
  'use strict';

  // ── Register Service Worker ─────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered, scope:', registration.scope);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast();
              }
            });
          });
        })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    });
  }

  // ── Online / Offline indicator ──────────────────────────────────────────
  function createOfflineBanner() {
    if (document.getElementById('pwa-offline-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'pwa-offline-bar';
    bar.innerHTML = `
      <span style="width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pwaPulse 1.5s infinite;display:inline-block;margin-right:8px;"></span>
      You're offline — viewing cached data
    `;
    bar.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: rgba(239,68,68,0.92); color: #fff;
      text-align: center; padding: 10px 16px; font-size: 13px; font-weight: 600;
      font-family: 'Inter', sans-serif; backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
    `;
    document.body.appendChild(bar);

    // Add pulse keyframe
    if (!document.getElementById('pwa-style')) {
      const style = document.createElement('style');
      style.id = 'pwa-style';
      style.textContent = `
        @keyframes pwaPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        #pwa-install-btn {
          position: fixed; bottom: 24px; right: 24px; z-index: 9000;
          background: linear-gradient(135deg,#6c63ff,#a855f7);
          color: #fff; border: none; border-radius: 50px;
          padding: 13px 22px; font-size: 14px; font-weight: 700;
          font-family: 'Inter',sans-serif; cursor: pointer;
          box-shadow: 0 6px 30px rgba(108,99,255,0.5);
          display: flex; align-items: center; gap: 8px;
          transition: all 0.25s ease;
          animation: pwaSlideUp 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        #pwa-install-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 40px rgba(108,99,255,0.65); }
        @keyframes pwaSlideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        #pwa-update-toast {
          position: fixed; top: 16px; right: 16px; z-index: 9999;
          background: rgba(108,99,255,0.95); color:#fff;
          border-radius: 12px; padding: 14px 20px; max-width: 320px;
          font-size: 13px; font-weight: 600; font-family: 'Inter',sans-serif;
          box-shadow: 0 8px 32px rgba(108,99,255,0.4);
          display: flex; align-items: center; gap: 12px;
          animation: pwaSlideDown 0.4s ease;
        }
        @keyframes pwaSlideDown { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        #pwa-notif-banner {
          background: linear-gradient(135deg,rgba(108,99,255,0.15),rgba(168,85,247,0.1));
          border: 1px solid rgba(108,99,255,0.3); border-radius: 12px;
          padding: 14px 18px; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; font-size: 13px; font-family: 'Inter',sans-serif;
        }
        #pwa-notif-banner .pwa-notif-text { color: rgba(240,244,255,0.8); flex:1; }
        #pwa-notif-banner .pwa-notif-btn {
          background: linear-gradient(135deg,#6c63ff,#a855f7); color:#fff;
          border:none; border-radius:8px; padding:8px 16px;
          font-size:12px; font-weight:700; cursor:pointer;
          font-family:'Inter',sans-serif; white-space:nowrap;
        }
        #pwa-notif-banner .pwa-notif-dismiss {
          background:none; border:none; color:rgba(240,244,255,0.4);
          cursor:pointer; font-size:16px; padding:4px; line-height:1;
        }
      `;
      document.head.appendChild(style);
    }
    return bar;
  }

  function showOfflineBanner() {
    const bar = document.getElementById('pwa-offline-bar') || createOfflineBanner();
    requestAnimationFrame(() => { bar.style.transform = 'translateY(0)'; });
  }
  function hideOfflineBanner() {
    const bar = document.getElementById('pwa-offline-bar');
    if (bar) bar.style.transform = 'translateY(100%)';
  }

  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online',  hideOfflineBanner);
  if (!navigator.onLine) showOfflineBanner();

  // ── Install Prompt (beforeinstallprompt) ────────────────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById('pwa-install-btn')) return;
    createOfflineBanner(); // ensures pwa-style is injected

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.innerHTML = '⬇️ Install App';
    btn.setAttribute('aria-label', 'Install Smoke-Free Tracker app');
    btn.addEventListener('click', triggerInstall);
    document.body.appendChild(btn);
  }

  async function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
  }

  // Hide button when app is installed
  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
    console.log('[PWA] App installed!');
  });

  // ── Update toast ────────────────────────────────────────────────────────
  function showUpdateToast() {
    if (document.getElementById('pwa-update-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.innerHTML = `
      <span>🔄</span>
      <div style="flex:1">
        <div>App updated!</div>
        <div style="font-weight:400;opacity:0.8;font-size:12px;margin-top:2px">Reload to get the latest version.</div>
      </div>
      <button onclick="window.location.reload()" style="background:rgba(255,255,255,0.2);border:none;border-radius:6px;padding:6px 12px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;">Reload</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  }

  // ── Push Notification Permission ─────────────────────────────────────────
  const NOTIF_KEY = 'pwa-notif-asked';

  function injectNotifBanner() {
    if (localStorage.getItem(NOTIF_KEY)) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    // Inject before first card on dashboard
    const target = document.getElementById('stats-container')
                || document.querySelector('.main-content')
                || document.body;

    const banner = document.createElement('div');
    banner.id = 'pwa-notif-banner';
    banner.innerHTML = `
      <span>🔔</span>
      <span class="pwa-notif-text">Enable notifications to get streak reminders, achievement alerts &amp; motivation!</span>
      <button class="pwa-notif-btn" onclick="requestNotifPermission()">Enable</button>
      <button class="pwa-notif-dismiss" onclick="dismissNotifBanner()" aria-label="Dismiss">✕</button>
    `;

    // Insert at top of stats-container, or before main-content's first child
    if (target.id === 'stats-container') {
      target.insertBefore(banner, target.firstChild);
    } else {
      target.insertAdjacentElement('afterbegin', banner);
    }
  }

  window.requestNotifPermission = async function () {
    localStorage.setItem(NOTIF_KEY, '1');
    const banner = document.getElementById('pwa-notif-banner');
    if (banner) banner.remove();

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Subscribe to push if VAPID key is set (optional)
      scheduleMotivation();
      new Notification('🚭 Notifications Enabled!', {
        body: 'You\'ll now get streak updates and motivation!',
        icon: '/icons/icon-192.png',
      });
    }
  };

  window.dismissNotifBanner = function () {
    localStorage.setItem(NOTIF_KEY, '1');
    const banner = document.getElementById('pwa-notif-banner');
    if (banner) banner.remove();
  };

  // Schedule periodic motivation via service worker message
  function scheduleMotivation() {
    if (!navigator.serviceWorker.controller) return;
    // Send a motivation once right away, then every 4 hours
    navigator.serviceWorker.controller.postMessage({ type: 'SEND_MOTIVATION' });
  }

  // ── Expose public helpers ─────────────────────────────────────────────────
  window.pwa = {
    triggerInstall,
    requestNotifPermission: window.requestNotifPermission,
    scheduleMotivation,
    isOnline: () => navigator.onLine,
    sendNotification: function (title, body, url) {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon:  '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [200, 100, 200],
            data:  { url: url || '/dashboard.html' },
          });
        });
      }
    },
  };

  // Auto-inject notification banner on dashboard
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard')) {
      setTimeout(injectNotifBanner, 2000);
    }
  });

})();
