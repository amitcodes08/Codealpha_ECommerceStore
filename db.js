const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      image_url TEXT NOT NULL,
      gallery_json TEXT,
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 50,
      specs_json TEXT,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      shipping REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Seed default user if not exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('john@example.com');
  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('password123', salt);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'John Doe',
      'john@example.com',
      hash,
      'customer'
    );
  }

  // Seed products if empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const seedProducts = [
      {
        name: 'Aura Pro Wireless ANC Headphones',
        description: 'Engineered for audio purists. Active Noise Cancellation with high-resolution acoustic drivers, transparency mode, and ultra-plush memory foam cushions for 40 hours of immersive listening.',
        category: 'Audio',
        price: 249.99,
        original_price: 299.99,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
        ]),
        rating: 4.8,
        review_count: 142,
        stock: 35,
        specs_json: JSON.stringify({
          'Battery Life': '40 Hours (ANC On)',
          'Connectivity': 'Bluetooth 5.3 & 3.5mm Aux',
          'Noise Cancellation': 'Hybrid Active ANC with 4 mics',
          'Weight': '250g',
          'Warranty': '2 Years Official Warranty'
        }),
        featured: 1
      },
      {
        name: 'Titan Horizon Smartwatch Series 7',
        description: 'Next-generation biometric tracking with an edge-to-edge sapphire crystal AMOLED display, ECG monitoring, SpO2 sensor, titanium chassis, and water resistance up to 50 meters.',
        category: 'Wearables',
        price: 329.00,
        original_price: 379.00,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
        ]),
        rating: 4.9,
        review_count: 89,
        stock: 24,
        specs_json: JSON.stringify({
          'Display': '1.92" AMOLED Always-On (1000 nits)',
          'Battery': '7 Days Typical Usage',
          'Sensors': 'Optical Heart Rate, ECG, SpO2, Accelerometer',
          'Water Resistance': '5 ATM (50m depth)',
          'Compatibility': 'iOS & Android'
        }),
        featured: 1
      },
      {
        name: 'Vortex Mechanical Gaming Keyboard RGB',
        description: 'Aircraft-grade aluminum frame equipped with hot-swappable linear mechanical switches, per-key RGB backlighting, sound-dampening silicone gaskets, and a magnetic palm rest.',
        category: 'Accessories',
        price: 139.50,
        original_price: 169.00,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80'
        ]),
        rating: 4.7,
        review_count: 215,
        stock: 50,
        specs_json: JSON.stringify({
          'Switch Type': 'Gateron Red Linear (Hot-swappable)',
          'Keycaps': 'Double-shot PBT OEM Profile',
          'Polling Rate': '1000Hz Ultra-Low Latency',
          'Cable': 'Detachable Braided USB-C to USB-A',
          'Layout': 'Tenkeyless (87 Keys)'
        }),
        featured: 1
      },
      {
        name: 'Lumix Prime 4K Mirrorless Camera',
        description: 'Capture cinematic brilliance with a 33MP full-frame sensor, 4K 60p 10-bit recording, 5-axis in-body image stabilization, and lightning-fast real-time eye autofocus.',
        category: 'Electronics',
        price: 1199.00,
        original_price: 1399.00,
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'
        ]),
        rating: 4.9,
        review_count: 67,
        stock: 12,
        specs_json: JSON.stringify({
          'Sensor': '33 Megapixel Full-Frame BSI CMOS',
          'Video Recording': '4K UHD up to 60fps 4:2:2 10-Bit',
          'Stabilization': '5-Axis In-Body Sensor-Shift',
          'ISO Range': '100 - 51,200 (Expandable to 204,800)',
          'Mount': 'Universal E-Mount'
        }),
        featured: 1
      },
      {
        name: 'Zenith Ultra Slim 15" Creator Laptop',
        description: 'Powered by the latest 14-core processor and dedicated studio graphics. Boasts a breathtaking 3.2K 120Hz OLED touch display, all-day battery life, and sleek CNC aluminum unibody.',
        category: 'Electronics',
        price: 1499.00,
        original_price: 1699.00,
        image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'
        ]),
        rating: 4.9,
        review_count: 53,
        stock: 15,
        specs_json: JSON.stringify({
          'Processor': 'Intel Core i7-13700H (14 Cores, 20 Threads)',
          'RAM': '32GB LPDDR5 6000MHz',
          'Storage': '1TB NVMe PCIe 4.0 SSD',
          'Display': '15.6" 3.2K OLED (3200x2000), 120Hz, 100% DCI-P3',
          'Weight': '1.68 kg'
        }),
        featured: 0
      },
      {
        name: 'Pulse Bass 360 Portable Speaker',
        description: 'IPX7 waterproof Bluetooth speaker delivering 360-degree room-filling acoustic output with dual passive radiators and customizable ambient LED glow.',
        category: 'Audio',
        price: 89.99,
        original_price: 119.99,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'
        ]),
        rating: 4.6,
        review_count: 310,
        stock: 40,
        specs_json: JSON.stringify({
          'Battery': '24 Hours Continuous Playtime',
          'Waterproof': 'IPX7 Submersible up to 1m',
          'Output Power': '30W RMS',
          'Pairing': 'True Wireless Stereo (TWS) Dual Connect'
        }),
        featured: 0
      },
      {
        name: 'ErgoGlide Precision Wireless Mouse',
        description: 'Sculpted ergonomic contour with silent tactile switches, hyper-scroll thumb wheel, 8000 DPI Darkfield glass tracking, and multi-device Bluetooth / 2.4GHz pairing.',
        category: 'Accessories',
        price: 79.00,
        original_price: 99.00,
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'
        ]),
        rating: 4.8,
        review_count: 178,
        stock: 65,
        specs_json: JSON.stringify({
          'Sensor': 'Darkfield High Precision 200 - 8000 DPI',
          'Battery': 'Rechargeable Li-Po (Up to 70 days per charge)',
          'Connectivity': 'Bluetooth Low Energy & Logi Bolt USB',
          'Buttons': '7 Programmable Action Buttons'
        }),
        featured: 0
      },
      {
        name: 'VisionFit Active Smart Band',
        description: 'Lightweight everyday fitness tracker with continuous heart-rate monitoring, sleep stage scoring, 30+ sports modes, and up to 14 days on a single charge.',
        category: 'Wearables',
        price: 49.99,
        original_price: 69.99,
        image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80',
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80'
        ]),
        rating: 4.5,
        review_count: 94,
        stock: 80,
        specs_json: JSON.stringify({
          'Display': '1.47" AMOLED Color Screen',
          'Water Resistance': '50M Water Resistant',
          'Battery': '14-Day Typical Endurance',
          'Weight': '18g Featherweight Strap'
        }),
        featured: 0
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        name, description, category, price, original_price, image_url,
        gallery_json, rating, review_count, stock, specs_json, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedProducts) {
      insertProd.run(
        p.name,
        p.description,
        p.category,
        p.price,
        p.original_price,
        p.image_url,
        p.gallery_json,
        p.rating,
        p.review_count,
        p.stock,
        p.specs_json,
        p.featured
      );
    }

    // Seed sample reviews
    const insertReview = db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-2 days'))
    `);
    insertReview.run(1, 'Sarah Jenkins', 5, 'The active noise cancellation is remarkable! Comfortable for 8-hour flights.');
    insertReview.run(1, 'David Miller', 5, 'Crystal clear mids and punchy bass without distortion. Worth every penny.');
    insertReview.run(2, 'Emily Watson', 5, 'Battery lasts a full week easily. The display is bright even in direct sunlight.');
    insertReview.run(3, 'Alex Torres', 4, 'Smooth linear switches and premium heavy chassis. RGB software is super easy to configure.');
  }
}

initSchema();

module.exports = db;
