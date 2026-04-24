/* ============================================
   LOGIN.JS — Client-side Auth (GitHub Pages)
   Uses localStorage — no server needed
   ============================================ */
const ADMIN_EMAIL = 'renuka@library.com';
const ADMIN_PASS = 'moms_library_2026';
const AUTH_KEY = 'rkl_admin_auth';

document.addEventListener('DOMContentLoaded', () => {
  // Already logged in? Go to dashboard
  if (localStorage.getItem(AUTH_KEY) === 'true') {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Simulate small delay for UX
    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        localStorage.setItem(AUTH_KEY, 'true');
        window.location.href = 'dashboard.html';
      } else {
        errorDiv.textContent = 'Invalid email or password';
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
      }
    }, 500);
  });
});
