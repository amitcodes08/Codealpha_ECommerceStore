# CodeAlpha Task 1: Full-Stack Simple E-Commerce Store (NovaTech)

A modern, responsive full-stack e-commerce web application built for the **CodeAlpha Full Stack Development Internship**.

---

## 🚀 Features

1. **Product Listings & Catalog**:
   - High-definition products catalog categorized into Audio, Wearables, Accessories, and Electronics.
   - Live real-time search with debounce.
   - Dynamic sorting by price (low to high, high to low), and top ratings.
   - Category filtering with live item count pills.

2. **Product Details Page (`product.html`)**:
   - Multi-image gallery with interactive thumbnail switching.
   - Technical specifications breakdown table.
   - Live stock indicator & quantity selector.
   - Verified customer reviews & rating display.
   - Interactive modal to submit new customer reviews and star ratings.

3. **Shopping Cart (`cart.html` & Cart Slideout Drawer)**:
   - Floating cart drawer accessible across all pages with animated count badge.
   - Add/remove items and increment/decrement quantity with auto-recalculation.
   - Live calculations for subtotal, 8% sales tax, and automated free shipping over $150.
   - Cart state preserved in `localStorage`.

4. **Order Processing & Checkout**:
   - Seamless multi-step checkout form with customer information, delivery address, and payment method options (Credit/Debit Card, Instant UPI/Wire, Cash on Delivery).
   - Generates unique tracking order numbers (`CA-XXXXXX-XXXX`).
   - Confirmation modal with order summary and instant invoice breakdown.

5. **User Registration & Login (`auth.js`)**:
   - Secure authentication with password hashing using `bcryptjs` and session tokens with `jsonwebtoken`.
   - Tabbed login and registration modal with pre-configured 1-click demo account (`john@example.com` / `password123`).
   - Personalized user dropdown with profile avatar, order history link, and logout.

6. **Order History & Tracking (`orders.html`)**:
   - Logged-in user order tracking displaying order status (Confirmed/Processing), itemized breakdown, delivery address, and timestamps.
   - Instant search/lookup tool by order number.

7. **Database Persistence**:
   - Built-in SQLite database (`ecommerce.db`) with tables for `users`, `products`, `orders`, `order_items`, and `reviews`.
   - Auto-seeded with realistic products and customer reviews.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom design system, glassmorphism, responsive CSS Grid/Flexbox), Vanilla JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (built-in native driver).
- **Security & Auth**: `bcryptjs` for password hashing, `jsonwebtoken` (JWT) for authentication tokens, CORS enabled.

---

## 📦 Installation & Setup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd Task1_Ecommerce_Store
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

---

## 🔑 Demo Credentials

- **Email**: `john@example.com`
- **Password**: `password123`
- *(Or click the "Fill Demo Account" button in the sign-in modal)*

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Fetch all products (supports `?category=`, `?search=`, `?sort=`) |
| `GET` | `/api/products/:id` | Fetch product details, gallery, specs, and customer reviews |
| `POST` | `/api/products/:id/reviews` | Submit a customer rating and review |
| `GET` | `/api/categories` | Fetch all available categories with product counts |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| `POST` | `/api/orders` | Place a new order with items and shipping details |
| `GET` | `/api/orders/my-orders` | Fetch past orders for authenticated user |
| `GET` | `/api/orders/:orderNumber` | Lookup order by order number |
