/* ============================================
   DASHBOARD.JS — Admin Post Management
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  checkDashboardAuth();
  loadDashboardPosts();
  initModal();
  initLogout();
  initFileInput();
});

/* ---- Auth Check ---- */
async function checkDashboardAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.isAdmin) {
      window.location.href = '/login';
    }
  } catch (err) {
    window.location.href = '/login';
  }
}

/* ---- Load Posts ---- */
async function loadDashboardPosts() {
  const table = document.getElementById('postsTable');

  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    if (posts.length === 0) {
      table.innerHTML = `
        <div class="no-posts">
          <div class="icon">✨</div>
          <p>No posts yet. Click "New Post" to create your first story or poem!</p>
        </div>
      `;
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
  } catch (err) {
    table.innerHTML = `
      <div class="no-posts">
        <div class="icon">⚠️</div>
        <p>Error loading posts. Please refresh the page.</p>
      </div>
    `;
  }
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

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePost();
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(post = null) {
  const modal = document.getElementById('postModal');
  const title = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');

  // Reset form
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
async function savePost() {
  const id = document.getElementById('postId').value;
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const formData = new FormData();
  formData.append('title', document.getElementById('postTitle').value);
  formData.append('category', document.getElementById('postCategory').value);
  formData.append('content', document.getElementById('postContent').value);

  const imageFile = document.getElementById('postImage').files[0];
  if (imageFile) {
    formData.append('coverImage', imageFile);
  }

  try {
    const url = id ? `/api/posts/${id}` : '/api/posts';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (data.success) {
      showToast(id ? 'Post updated successfully! ✨' : 'Post published successfully! 🎉');
      closeModal();
      loadDashboardPosts();
    } else {
      showToast('Error saving post', true);
    }
  } catch (err) {
    showToast('Connection error', true);
  }

  saveBtn.disabled = false;
  saveBtn.textContent = id ? 'Update Post' : 'Publish Post';
}

/* ---- Edit Post ---- */
async function editPost(id) {
  try {
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    openModal(post);
  } catch (err) {
    showToast('Error loading post', true);
  }
}

/* ---- Delete Post ---- */
async function deletePost(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      showToast('Post deleted 🗑️');
      loadDashboardPosts();
    } else {
      showToast('Error deleting post', true);
    }
  } catch (err) {
    showToast('Connection error', true);
  }
}

/* ---- View Post ---- */
function viewPost(id) {
  window.open(`/post/${id}`, '_blank');
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
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {}
    window.location.href = '/login';
  });
}

/* ---- Toast Notification ---- */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
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
    month: 'short',
    day: 'numeric'
  });
}
