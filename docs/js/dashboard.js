/* ============================================
   DASHBOARD.JS — Client-side Post Management
   All CRUD via localStorage — no server needed
   ============================================ */
const AUTH_KEY = 'rkl_admin_auth';
const POSTS_KEY = 'rkl_posts';

document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (localStorage.getItem(AUTH_KEY) !== 'true') {
    window.location.href = 'login.html';
    return;
  }
  initPosts();
  initModal();
  initLogout();
  initFileInput();
});

/* ---- Initialize posts from static JSON if localStorage is empty ---- */
async function initPosts() {
  if (!localStorage.getItem(POSTS_KEY)) {
    try {
      const res = await fetch('data/posts.json');
      const posts = await res.json();
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch { localStorage.setItem(POSTS_KEY, '[]'); }
  }
  loadDashboardPosts();
}

function getPosts() {
  try { return JSON.parse(localStorage.getItem(POSTS_KEY)) || []; }
  catch { return []; }
}

function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

/* ---- Load Posts ---- */
function loadDashboardPosts() {
  const table = document.getElementById('postsTable');
  const posts = getPosts();

  if (posts.length === 0) {
    table.innerHTML = `<div class="no-posts"><div class="icon">✨</div><p>No posts yet. Click "New Post" to create your first story or poem!</p></div>`;
    return;
  }

  table.innerHTML = posts.map(post => `
    <div class="post-row">
      <div class="post-info">
        <h4>${escapeHtml(post.title)}</h4>
        <div class="meta">
          <span class="badge">${post.category}</span>
          <span>${formatDate(post.createdAt)}</span>
        </div>
      </div>
      <div class="post-actions">
        <button class="btn btn-secondary btn-sm" onclick="viewPost('${post.id}')">👁️ View</button>
        <button class="btn btn-secondary btn-sm" onclick="editPost('${post.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}', '${escapeHtml(post.title).replace(/'/g, "\\'")}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

/* ---- Modal ---- */
function initModal() {
  const modal = document.getElementById('postModal');
  const newBtn = document.getElementById('newPostBtn');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('postForm');

  newBtn.addEventListener('click', () => openModal());
  closeBtn.addEventListener('click', () => closeModal());
  cancelBtn.addEventListener('click', () => closeModal());
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); savePost(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function openModal(post = null) {
  const modal = document.getElementById('postModal');
  const title = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');

  document.getElementById('postForm').reset();
  document.getElementById('postId').value = '';
  document.getElementById('fileLabel').textContent = '📷 Click or drag to upload a cover image';
  document.getElementById('fileLabel').classList.remove('has-file');

  if (post) {
    title.textContent = 'Edit Post';
    saveBtn.textContent = 'Update Post';
    document.getElementById('postId').value = post.id;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postCategory').value = post.category;
    document.getElementById('postContent').value = post.content;
  } else {
    title.textContent = 'New Post';
    saveBtn.textContent = 'Publish Post';
  }

  modal.classList.add('active');
  document.getElementById('postTitle').focus();
}

function closeModal() {
  document.getElementById('postModal').classList.remove('active');
}

/* ---- Save Post (Create / Update) ---- */
function savePost() {
  const id = document.getElementById('postId').value;
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const postTitle = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const content = document.getElementById('postContent').value.trim();

  if (!postTitle || !content) {
    showToast('Please fill in title and content', true);
    saveBtn.disabled = false;
    saveBtn.textContent = id ? 'Update Post' : 'Publish Post';
    return;
  }

  const posts = getPosts();
  const imageFile = document.getElementById('postImage').files[0];

  const finishSave = (coverImage) => {
    if (id) {
      const idx = posts.findIndex(p => p.id === id);
      if (idx !== -1) {
        posts[idx].title = postTitle;
        posts[idx].category = category;
        posts[idx].content = content;
        posts[idx].excerpt = content.substring(0, 150);
        if (coverImage) posts[idx].coverImage = coverImage;
      }
      showToast('Post updated successfully! ✨');
    } else {
      const newPost = {
        id: Date.now().toString(),
        title: postTitle,
        category,
        content,
        excerpt: content.substring(0, 150),
        coverImage: coverImage || null,
        createdAt: new Date().toISOString()
      };
      posts.unshift(newPost);
      showToast('Post published successfully! 🎉');
    }

    savePosts(posts);
    closeModal();
    loadDashboardPosts();
    saveBtn.disabled = false;
    saveBtn.textContent = id ? 'Update Post' : 'Publish Post';
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = (e) => finishSave(e.target.result);
    reader.readAsDataURL(imageFile);
  } else {
    finishSave(null);
  }
}

/* ---- View Post ---- */
function viewPost(id) {
  window.open(`post.html?id=${id}`, '_blank');
}

/* ---- Edit Post ---- */
function editPost(id) {
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  if (post) openModal(post);
  else showToast('Post not found', true);
}

/* ---- Delete Post ---- */
function deletePost(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis cannot be undone.`)) return;
  let posts = getPosts();
  posts = posts.filter(p => p.id !== id);
  savePosts(posts);
  showToast('Post deleted 🗑️');
  loadDashboardPosts();
}

/* ---- File Input Label ---- */
function initFileInput() {
  const fileInput = document.getElementById('postImage');
  const label = document.getElementById('fileLabel');
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      label.textContent = `✅ ${fileInput.files[0].name}`;
      label.classList.add('has-file');
    } else {
      label.textContent = '📷 Click or drag to upload a cover image';
      label.classList.remove('has-file');
    }
  });
}

/* ---- Logout ---- */
function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  });
}

/* ---- Toast ---- */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ---- Helpers ---- */
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
