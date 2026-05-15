# Coffee Equipment & Coffee Sales Management System

## 📖 Project Overview
This project is a foundation-level fullstack web application for managing and selling coffee products and brewing equipment. The system supports two main roles:
* Admin/Seller
* Customer/Buyer

The core business focuses on:
* Product & Inventory management
* Shopping cart & Order management
* Simulated QR payment
* AI-based product recommendation

[cite_start]The project demonstrates: Fullstack architecture, Authentication & authorization, RESTful API design, Database modeling, and Basic AI integration. [cite: 1, 3, 14, 15, 21]

---

## 🛠 Tech Stack

**Backend**
* [cite_start]FastAPI, Python, PostgreSQL, SQLAlchemy, Pydantic, JWT Authentication [cite: 23, 24, 25, 26, 27, 28, 29]

**Frontend**
* [cite_start]React, React Router, Axios, Context API/Redux [cite: 30, 31, 32, 33, 34]

**AI Integration (Optional/Future)**
* [cite_start]LLM API (OpenAI/Gemini) for personalized recommendation text [cite: 37, 38, 40]

---

## ⚙️ Main Business Features

### Authentication & Authorization
* [cite_start]**Customer:** Register, Login, Logout, View profile [cite: 43, 44, 45, 46, 47]
* [cite_start]**Admin:** Login, Force password change on first login, Manage products/inventory/orders [cite: 48, 49, 50, 51, 52, 53]
* [cite_start]**Role System:** Roles include `admin` and `customer`, secured by JWT and role-checking middleware [cite: 54, 55, 58]

### Core Modules
* **Product Module:** Search, filter by category, image handling, and stock status tracking. [cite_start]Admins have full CRUD permissions [cite: 60, 64, 65, 69]
* [cite_start]**Cart Module:** Manage items, update quantities, and select specific items for checkout (`is_selected` logic) [cite: 75, 81, 82, 83]
* **Order & Payment:** Full checkout flow with simulated QR payments containing order code and amount. [cite_start]Order statuses: `pending`, `confirmed`, `shipping`, `completed`, `cancelled` [cite: 85, 91, 93, 101, 108]

---

## 🤖 AI Recommendation System
The system integrates AI at three distinct touchpoints:

1. [cite_start]**Onboarding (Cold Start):** Maps new user preferences (flavors, brewing methods) to product tags for immediate recommendations [cite: 114, 118, 123]
2. [cite_start]**Contextual Recommendation:** Batch processing of user behavior (views, clicks, purchases) to select Top 5 products, with LLM-generated personalized sales pitches [cite: 137, 142, 149, 154, 159]
3. [cite_start]**Cross-Selling (Checkout):** Suggests complementary items (e.g., Filter Paper for a V60 Dripper) based on pre-defined product pairings [cite: 168, 171, 178, 184]

---

## 🗄 Database Design

### Core Tables
* [cite_start]**users:** `id`, `full_name`, `email`, `password_hash`, `phone`, `address`, `role`, `must_change_password`, `timestamps` [cite: 242]
* [cite_start]**categories:** `id`, `name`, `description`, `timestamps` [cite: 244]
* [cite_start]**products:** `id`, `category_id`, `name`, `description`, `price`, `stock_quantity`, `flavor`, `status`, `image_url`, `timestamps` [cite: 246]
* [cite_start]**carts & cart_items:** Tracks user selections and quantities; includes `is_selected` for checkout [cite: 248, 250]
* [cite_start]**orders & order_items:** Stores transaction details, receiver info, status, and snapshots of product price/name at time of purchase [cite: 252, 254]
* [cite_start]**payments:** `id`, `order_id`, `method`, `amount`, `qr_content`, `status`, `paid_at`, `timestamps` [cite: 256]
* [cite_start]**inventory_logs:** Tracks stock changes (type, quantity, note, creator) [cite: 258]

### AI-Related Tables
* **user_preferences:** Stores preferred flavors and brewing methods from onboarding [cite: 261]
* **product_tags & product_tag_items:** Used to map products to specific characteristics for AI matching [cite: 263, 265]
* **user_behaviors:** Logs interaction types (`view`, `search`, `add_to_cart`, `purchase`) [cite: 267]
* **recommendation_logs:** Caches generated recommendations and LLM-generated titles/pitches [cite: 269]
* **product_pairings:** Stores `source_product_id`, `target_product_id`, and `ai_pitch` for cross-selling [cite: 271]

### Main Relationships
* [cite_start]One user has many orders and one cart [cite: 273, 274]
* One cart/order has many items [cite: 275, 276]
* [cite_start]One category has many products [cite: 277]
* [cite_start]Products and tags have a many-to-many relationship [cite: 278, 279]
* One order has one payment [cite: 281]

---

## 🎯 Current Scope & Roadmap

* [cite_start]**Must Have:** Full Auth, Product/Inventory CRUD, Cart, Checkout, Order management, QR simulation [cite: 288, 289, 291, 297]
* [cite_start]**Should Have:** Search/Filtering, Low stock warnings, Recommendation system [cite: 298, 302]
* **Implementation Priority:** 1. Database -> 2. Auth -> 3. Product CRUD -> 4. Cart -> 5. Order -> 6. Payment -> 7. Inventory -> 8. Recommendation [cite: 310, 311, 318]

---

## 📌 Development Notes
* [cite_start]**AI Focus:** Prioritize practical business workflows and recommendation logic over complex chatbots or heavy ML training [cite: 320, 324]
* [cite_start]**Goal:** Demonstrate clean architecture and scalable fullstack engineering [cite: 330, 336]