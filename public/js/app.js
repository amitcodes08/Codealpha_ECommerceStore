// Main Application & Cart Manager for Task 1 E-commerce Store

// Toast Notifications
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info') {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
window.Toast = Toast;

// Cart System
const Cart = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem('codealpha_cart')) || [];
    } catch (e) {
      return [];
    }
  },
  saveItems(items) {
    localStorage.setItem('codealpha_cart', JSON.stringify(items));
    this.updateBadge();
    this.renderDrawer();
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
  },
  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: quantity
      });
    }

    this.saveItems(items);
    Toast.show(`Added "${product.name}" to cart!`, 'success');
  },
  updateQuantity(productId, quantity) {
    let items = this.getItems();
    if (quantity <= 0) {
      items = items.filter(i => i.id !== productId);
    } else {
      const item = items.find(i => i.id === productId);
      if (item) item.quantity = quantity;
    }
    this.saveItems(items);
  },
  removeItem(productId) {
    const items = this.getItems().filter(i => i.id !== productId);
    this.saveItems(items);
    Toast.show('Item removed from cart', 'info');
  },
  clear() {
    localStorage.removeItem('codealpha_cart');
    this.updateBadge();
    this.renderDrawer();
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } }));
  },
  getTotals() {
    const items = this.getItems();
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shipping = items.length === 0 ? 0 : (subtotal > 150 ? 0 : 9.99);
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { subtotal, tax, shipping, total, count };
  },
  updateBadge() {
    const { count } = this.getTotals();
    const badge = document.getElementById('cartBadgeCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  },
  initDrawer() {
    if (document.getElementById('cartDrawerOverlay')) return;
    const drawerHtml = `
      <div id="cartDrawerOverlay" class="drawer-overlay">
        <div class="cart-drawer">
          <div class="drawer-header">
            <h3 class="drawer-title">Shopping Cart</h3>
            <button class="close-btn" id="closeCartDrawer">&times;</button>
          </div>
          <div class="drawer-body" id="cartDrawerItems">
            <!-- Items injected here -->
          </div>
          <div class="drawer-footer" id="cartDrawerFooter">
            <!-- Totals injected here -->
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHtml);

    const overlay = document.getElementById('cartDrawerOverlay');
    const closeBtn = document.getElementById('closeCartDrawer');

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    const openBtns = document.querySelectorAll('.open-cart-drawer');
    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
        this.renderDrawer();
      });
    });

    this.updateBadge();
    this.renderDrawer();
  },
  renderDrawer() {
    const itemsContainer = document.getElementById('cartDrawerItems');
    const footerContainer = document.getElementById('cartDrawerFooter');
    if (!itemsContainer || !footerContainer) return;

    const items = this.getItems();
    const { subtotal, tax, shipping, total } = this.getTotals();

    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; margin: auto; padding: 2rem 0; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
          <h4>Your cart is empty</h4>
          <p style="font-size: 0.88rem; margin-top: 0.5rem;">Explore our curated collection and add items to your cart.</p>
        </div>
      `;
      footerContainer.innerHTML = `
        <button class="btn btn-secondary" style="width: 100%;" onclick="document.getElementById('cartDrawerOverlay').classList.remove('active')">
          Continue Shopping
        </button>
      `;
      return;
    }

    itemsContainer.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          </div>
          <div class="cart-item-controls">
            <div class="qty-control">
              <button class="qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="delete-item-btn" onclick="Cart.removeItem(${item.id})" title="Remove">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    footerContainer.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Estimated Tax (8%)</span>
        <span>$${tax.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? '<span style="color: var(--success)">FREE</span>' : '$' + shipping.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span style="color: #a5b4fc;">$${total.toFixed(2)}</span>
      </div>
      <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
        <a href="/cart.html" class="btn btn-secondary" style="flex: 1; text-align: center;">View Cart</a>
        <a href="/cart.html#checkout" class="btn btn-primary" style="flex: 1.3; text-align: center;">Checkout</a>
      </div>
    `;
  }
};
window.Cart = Cart;

// Store catalog functionality for index.html
const Store = {
  products: [],
  currentCategory: 'All',
  searchQuery: '',
  sortBy: 'default',

  async init() {
    Cart.initDrawer();
    Auth.init();
    await this.loadCategories();
    await this.loadProducts();
    this.setupListeners();
  },

  async loadCategories() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();

      let html = `<button class="cat-btn active" data-category="All">All Products</button>`;
      categories.forEach(c => {
        html += `<button class="cat-btn" data-category="${c.category}">${c.category} (${c.count})</button>`;
      });
      tabsContainer.innerHTML = html;

      tabsContainer.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          tabsContainer.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentCategory = btn.dataset.category;
          this.loadProducts();
        });
      });
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  },

  async loadProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        Loading amazing products...
      </div>
    `;

    try {
      let url = `/api/products?category=${encodeURIComponent(this.currentCategory)}&sort=${this.sortBy}`;
      if (this.searchQuery) {
        url += `&search=${encodeURIComponent(this.searchQuery)}`;
      }

      const res = await fetch(url);
      this.products = await res.json();
      this.renderProducts();
    } catch (e) {
      grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--danger); text-align: center;">Failed to load products. Please check the backend connection.</div>`;
    }
  },

  renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (this.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>No products found</h3>
          <p>Try searching for a different term or selecting another category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.products.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-img-wrapper" onclick="window.location.href='/product.html?id=${p.id}'">
          <img src="${p.image_url}" alt="${p.name}" class="product-img" loading="lazy">
          <span class="badge-pill">${p.category}</span>
        </div>
        <div class="product-info">
          <div class="product-rating">
            <span>★ ${p.rating.toFixed(1)}</span>
            <span class="count">(${p.review_count} reviews)</span>
          </div>
          <h3 class="product-name" onclick="window.location.href='/product.html?id=${p.id}'">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-footer">
            <div class="price-box">
              <span class="price">$${p.price.toFixed(2)}</span>
              ${p.original_price ? `<span class="orig-price">$${p.original_price.toFixed(2)}</span>` : ''}
            </div>
            <button class="add-cart-btn" onclick="Store.addToCart(${p.id}, event)" title="Add to Cart">
              🛒
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  addToCart(productId, event) {
    if (event) event.stopPropagation();
    const product = this.products.find(p => p.id === productId);
    if (product) {
      Cart.addItem(product, 1);
    }
  },

  setupListeners() {
    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadProducts();
        }, 300);
      });
    }

    const sortSelect = document.getElementById('storeSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.loadProducts();
      });
    }
  }
};

window.Store = Store;
