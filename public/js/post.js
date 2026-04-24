/* ============================================
   POST.JS — Reading Page
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  loadPost();
  initThemeToggle();
});

/* ---- Load Post ---- */
async function loadPost() {
  const container = document.getElementById('readingContainer');

  // Get post ID from URL: /post/123
  const pathParts = window.location.pathname.split('/');
  const postId = pathParts[pathParts.length - 1];

  if (!postId) {
    container.innerHTML = '<p style="text-align:center; padding: 4rem;">Post not found.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/posts/${postId}`);
    
    if (!res.ok) {
      container.innerHTML = `
        <div style="text-align:center; padding: 4rem;">
          <p style="font-size: 3rem; margin-bottom: 1rem;">📖</p>
          <p>This post could not be found.</p>
          <a href="/" style="display: inline-block; margin-top: 1rem;">← Back to Library</a>
        </div>
      `;
      return;
    }

    const post = await res.json();

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
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center; padding: 4rem;">
        <p>Error loading post. Please try refreshing.</p>
        <a href="/" style="display: inline-block; margin-top: 1rem;">← Back to Library</a>
      </div>
    `;
  }
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
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
