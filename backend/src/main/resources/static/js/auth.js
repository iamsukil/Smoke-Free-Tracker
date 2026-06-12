// ==============================
// auth.js — Login & Register
// ==============================

// Redirect if already logged in
if (localStorage.getItem('jwt')) {
  window.location.href = '/dashboard.html';
}

function switchTab(tab) {
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab     = document.getElementById('tab-login');
  const registerTab  = document.getElementById('tab-register');
  clearAlert();

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }
}

function showAlert(msg, type = 'danger') {
  const area = document.getElementById('alert-area');
  area.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
function clearAlert() {
  document.getElementById('alert-area').innerHTML = '';
}

// ===== LOGIN =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Signing in...';

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showAlert('Please fill in all fields.');
    btn.disabled = false;
    btn.innerHTML = 'Sign In';
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 800);
    } else {
      showAlert(data.error || 'Login failed. Please check your credentials.');
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  } catch (err) {
    showAlert('Network error. Please check if the server is running.');
    btn.disabled = false;
    btn.innerHTML = 'Sign In';
  }
});

// ===== REGISTER =====
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Creating account...';

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !password) {
    showAlert('Please fill in all fields.');
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
    return;
  }
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      showAlert('Account created! Redirecting to dashboard...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 900);
    } else {
      showAlert(data.error || 'Registration failed. Please try again.');
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  } catch (err) {
    showAlert('Network error. Please check if the server is running.');
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
  }
});
