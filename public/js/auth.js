// Authentication Manager for Task 1
const Auth = {
  getToken() {
    return localStorage.getItem('codealpha_token');
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('codealpha_user'));
    } catch (e) {
      return null;
    }
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  setAuth(token, user) {
    localStorage.setItem('codealpha_token', token);
    localStorage.setItem('codealpha_user', JSON.stringify(user));
    this.updateUI();
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  },
  logout() {
    localStorage.removeItem('codealpha_token');
    localStorage.removeItem('codealpha_user');
    this.updateUI();
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
    Toast.show('You have been logged out', 'info');
  },
  init() {
    this.renderAuthModal();
    this.updateUI();
    this.setupEventListeners();
  },
  renderAuthModal() {
    if (document.getElementById('authModal')) return;
    const modalHtml = `
      <div id="authModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="authModalTitle">Welcome to NovaTech</h3>
            <button class="close-btn" id="closeAuthModal">&times;</button>
          </div>
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Sign In</button>
            <button class="auth-tab" data-tab="register">Register</button>
          </div>
          
          <!-- Login Form -->
          <form id="loginForm">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" id="loginEmail" required placeholder="e.g. john@example.com">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" class="form-control" id="loginPassword" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">Sign In to Account</button>
            <button type="button" id="fillDemoLogin" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 0.75rem;">
              ⚡ Fill Demo Account (John Doe)
            </button>
          </form>

          <!-- Register Form -->
          <form id="registerForm" style="display: none;">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" class="form-control" id="regName" required placeholder="Alex Morgan">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" id="regEmail" required placeholder="alex@example.com">
            </div>
            <div class="form-group">
              <label>Password (minimum 6 characters)</label>
              <input type="password" class="form-control" id="regPassword" minlength="6" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">Create Account</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },
  setupEventListeners() {
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('closeAuthModal');
    const tabs = modal.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const fillDemoBtn = document.getElementById('fillDemoLogin');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        loginForm.style.display = isLogin ? 'block' : 'none';
        registerForm.style.display = isLogin ? 'none' : 'block';
        document.getElementById('authModalTitle').textContent = isLogin ? 'Welcome Back' : 'Create an Account';
      });
    });

    fillDemoBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'john@example.com';
      document.getElementById('loginPassword').value = 'password123';
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        Auth.setAuth(data.token, data.user);
        modal.classList.remove('active');
        Toast.show(`Welcome back, ${data.user.name}!`, 'success');
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        Auth.setAuth(data.token, data.user);
        modal.classList.remove('active');
        Toast.show(`Account created! Welcome, ${data.user.name}`, 'success');
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  },
  showModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
  },
  updateUI() {
    const container = document.getElementById('userNavArea');
    if (!container) return;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      container.innerHTML = `
        <div class="user-menu" id="userMenuWrapper">
          <button class="user-btn" id="userMenuBtn">
            <span class="avatar">${initial}</span>
            <span class="user-name-text">${user.name.split(' ')[0]}</span>
            <span>▾</span>
          </button>
          <div class="dropdown-menu" id="userDropdown">
            <div style="padding: 0.5rem 0.85rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.35rem;">
              <div style="font-weight: 700; font-size: 0.85rem;">${user.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
            </div>
            <a href="/orders.html" class="dropdown-item">📦 My Orders</a>
            <div class="dropdown-item" id="logoutBtn" style="color: var(--danger);">🚪 Sign Out</div>
          </div>
        </div>
      `;

      const menuBtn = document.getElementById('userMenuBtn');
      const dropdown = document.getElementById('userDropdown');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => dropdown.classList.remove('show'));

      document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
      });
    } else {
      container.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="openAuthBtn">
          Sign In
        </button>
      `;
      document.getElementById('openAuthBtn').addEventListener('click', () => {
        Auth.showModal();
      });
    }
  }
};

window.Auth = Auth;
