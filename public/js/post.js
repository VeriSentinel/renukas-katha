/* ============================================
   POST.JS — Reading Page (Client-side)
   ============================================ */

const POSTS_KEY = 'rkl_posts';

document.addEventListener('DOMContentLoaded', () => {
  loadPost();
  initThemeToggle();
});

/* ---- Load Post ---- */
async function loadPost() {
  const container = document.getElementById('readingContainer');

  // get ?id=123
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    showNotFound(container);
    return;
  }

  // Check localStorage first
  let posts = [];
  try {
    const stored = localStorage.getItem(POSTS_KEY);
    if (stored) posts = JSON.parse(stored);
  } catch(e) {}

  // If local storage doesn't have it, try fetching from static json
  if (posts.length === 0) {
    try {
      const res = await fetch('data/posts.json');
      posts = await res.json();
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch(e) {}
  }

  const post = posts.find(p => p.id === postId || String(p.id) === String(postId));

  if (!post) {
    showNotFound(container);
    return;
  }

  // Update page title
  document.title = `${post.title} — Renuka's Katha`;

  // Render post
  container.innerHTML = `
    ${post.coverImage ? `<img src="${post.coverImage}" alt="${escapeHtml(post.title)}" class="post-hero-image">` : ''}
    <span class="post-category">${post.category === 'Story' ? '📖' : '🪶'} ${post.category}</span>
    <h1>${escapeHtml(post.title)}</h1>
    <div class="post-date">${formatDate(post.createdAt)}</div>
    <div class="post-content ${post.category === 'Poem' ? 'poem' : ''}">${escapeHtml(post.content)}</div>
  `;
}

function showNotFound(container) {
  container.innerHTML = `
    <div style="text-align:center; padding: 4rem;">
      <p style="font-size: 3rem; margin-bottom: 1rem;">📖</p>
      <p>This post could not be found.</p>
      <a href="index.html" style="display: inline-block; margin-top: 1rem;">← Back to Library</a>
    </div>
  `;
}

/* ---- Dark/Light Mode Toggle ---- */
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  
  // Check saved preference
  const savedTheme = localStorage.getItem('rkl-theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    
    if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      toggle.textContent = '🌙';
      localStorage.setItem('rkl-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggle.textContent = '☀️';
      localStorage.setItem('rkl-theme', 'light');
    }
  });
}

/* ---- Helpers ---- */
function escapeHtml(text) {
  if(!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if(!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
