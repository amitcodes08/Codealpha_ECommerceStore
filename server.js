const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'codealpha_secret_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware (optional or strict)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name.trim(), email.toLowerCase().trim(), passwordHash);

    const user = { id: Number(result.lastInsertRowid), name: name.trim(), email: email.toLowerCase().trim(), role: 'customer' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: 'Registration successful', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful', token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// -------------------------------------------------------------
// PRODUCT ROUTES
// -------------------------------------------------------------
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category ASC
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const { category, search, sort, featured } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured === '1' || featured === 'true') {
      query += ' AND featured = 1';
    }

    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'price-asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const products = db.prepare(query).all(...params);

    // Parse specs and galleries
    const parsed = products.map(p => ({
      ...p,
      gallery: p.gallery_json ? JSON.parse(p.gallery_json) : [p.image_url],
      specs: p.specs_json ? JSON.parse(p.specs_json) : {}
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(id);

    res.json({
      ...product,
      gallery: product.gallery_json ? JSON.parse(product.gallery_json) : [product.image_url],
      specs: product.specs_json ? JSON.parse(product.specs_json) : {},
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

app.post('/api/products/:id/reviews', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { user_name, rating, comment } = req.body;

    if (!user_name || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required' });
    }

    const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

    db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(productId, user_name.trim(), numRating, comment.trim());

    // Update product rating and review count
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM reviews 
      WHERE product_id = ?
    `).get(productId);

    const roundedRating = Math.round((stats.avg_rating || 5) * 10) / 10;
    db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?')
      .run(roundedRating, stats.count, productId);

    res.status(201).json({ message: 'Review added successfully', rating: roundedRating, review_count: stats.count });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// -------------------------------------------------------------
// ORDER ROUTES
// -------------------------------------------------------------
app.post('/api/orders', optionalAuth, (req, res) => {
  try {
    const { customer_name, customer_email, address, city, postal_code, payment_method, items } = req.body;

    if (!customer_name || !customer_email || !address || !city || !postal_code || !payment_method) {
      return res.status(400).json({ error: 'All shipping and payment fields are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT id, name, price, image_url, stock FROM products WHERE id = ?').get(item.id);
      if (!product) {
        return res.status(400).json({ error: `Product ID ${item.id} not found` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      subtotal += product.price * qty;
      validatedItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: qty
      });
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% sales tax
    const shipping = subtotal > 150 ? 0 : 9.99; // Free shipping above $150
    const total_amount = Math.round((subtotal + tax + shipping) * 100) / 100;

    const orderNumber = 'CA-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    const userId = req.user ? req.user.id : null;

    // Insert order
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, address, city, postal_code,
        payment_method, subtotal, tax, shipping, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `).run(
      orderNumber,
      userId,
      customer_name.trim(),
      customer_email.toLowerCase().trim(),
      address.trim(),
      city.trim(),
      postal_code.trim(),
      payment_method,
      subtotal,
      tax,
      shipping,
      total_amount
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // Insert order items and adjust stock
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');

    for (const item of validatedItems) {
      insertItem.run(orderId, item.product_id, item.name, item.image_url, item.price, item.quantity);
      updateStock.run(item.quantity, item.product_id);
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        order_id: orderId,
        order_number: orderNumber,
        subtotal,
        tax,
        shipping,
        total_amount,
        status: 'Confirmed',
        customer_name,
        customer_email,
        items: validatedItems
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.get('/api/orders/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? OR customer_email = ?
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.email);

    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (err) {
    console.error('My orders error:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.get('/api/orders/:orderNumber', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Fallback routing for SPA / clean URLs
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.listen(PORT, () => {
  console.log(`Task 1 E-commerce Store server running at http://localhost:${PORT}`);
});
