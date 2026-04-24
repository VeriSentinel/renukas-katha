/* ============================================
   LOGIN.JS — Admin Authentication
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  checkAuth();

  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        errorDiv.textContent = data.message || 'Invalid credentials';
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
      }
    } catch (err) {
      errorDiv.textContent = 'Connection error. Is the server running?';
      loginBtn.textContent = 'Sign In';
      loginBtn.disabled = false;
    }
  });
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (data.isAdmin) {
      window.location.href = '/dashboard';
    }
  } catch (err) {
    // Not logged in, stay on login page
  }
}
