// ==============================
// community.js — Community Feed
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

let currentPage = 0;
const PAGE_SIZE = 8;

// Char counter
document.getElementById('post-content').addEventListener('input', function() {
  document.getElementById('char-count').textContent = this.value.length;
});

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

async function loadPosts(page = 0) {
  showEl('loading');
  hideEl('posts-container');
  hideEl('empty-state');
  hideEl('pagination');

  try {
    const res = await fetch(`/api/community/posts?page=${page}&size=${PAGE_SIZE}`, {
      headers: authHeaders()
    });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();

    hideEl('loading');

    if (!data.posts || data.posts.length === 0) {
      showEl('empty-state');
      return;
    }

    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    data.posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'post-card animate-fade';
      card.innerHTML = `
        <div class="post-header">
          <div class="post-avatar">${getInitial(post.authorName)}</div>
          <div>
            <div class="post-author">${escapeHtml(post.authorName)}</div>
            <div class="post-time">${timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-footer">
          <button class="like-btn" id="like-${post.id}" onclick="likePost(${post.id}, this)">
            ❤️ <span id="likes-${post.id}">${post.likes}</span>
          </button>
        </div>`;
      container.appendChild(card);
    });

    showEl('posts-container');

    // Pagination
    if (data.totalPages > 1) {
      renderPagination(page, data.totalPages);
      showEl('pagination');
    }

    currentPage = page;

  } catch (err) {
    hideEl('loading');
    console.error(err);
  }
}

function renderPagination(current, total) {
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = current === 0;
  prev.onclick = () => loadPosts(current - 1);
  pag.appendChild(prev);

  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${i === current ? 'active' : ''}`;
    btn.textContent = i + 1;
    btn.onclick = () => loadPosts(i);
    pag.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = current >= total - 1;
  next.onclick = () => loadPosts(current + 1);
  pag.appendChild(next);
}

async function likePost(id, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`/api/community/posts/${id}/like`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById(`likes-${id}`).textContent = data.likes;
      btn.classList.add('liked');
    }
  } catch {}
  btn.disabled = false;
}

// Create Post
document.getElementById('create-post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('post-content').value.trim();
  const btn = document.getElementById('post-btn');
  clearPostAlert();

  if (!content) {
    showPostAlert('Please write something to share.', 'danger');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content })
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('post-content').value = '';
      document.getElementById('char-count').textContent = '0';
      showPostAlert('✅ Post shared with the community!', 'success');
      loadPosts(0);
    } else {
      showPostAlert('❌ ' + (data.error || 'Failed to post.'), 'danger');
    }
  } catch {
    showPostAlert('Network error.', 'danger');
  }

  btn.disabled = false;
  btn.textContent = 'Post to Community';
});

function showPostAlert(msg, type) {
  const el = document.getElementById('create-alert');
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => el.innerHTML = '', 3000);
}
function clearPostAlert() {
  document.getElementById('create-alert').innerHTML = '';
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

loadPosts(0);
