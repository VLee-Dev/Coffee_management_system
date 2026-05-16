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

The project demonstrates: Fullstack architecture, Authentication & authorization, RESTful API design, Database modeling, and Basic AI integration.

---

## 🛠 Tech Stack

**Backend**
* FastAPI, Python, PostgreSQL, SQLAlchemy, Pydantic, JWT Authentication

**Frontend**
* React, React Router, Fetch API (native)

**AI Integration (Optional/Future)**
* LLM API (OpenAI/Gemini) for personalized recommendation text

---

## ⚙️ Main Business Features

### Authentication & Authorization
* **Customer:** Register, Login, Logout, View profile
* **Admin:** Login, Force password change on first login, Manage products/inventory/orders
* **Role System:** Roles include `admin` and `customer`, secured by JWT and role-checking middleware

### Core Modules
* **Product Module:** Search, filter by category, image handling, and stock status tracking. Admins have full CRUD permissions
* **Cart Module:** Manage items, update quantities, and select specific items for checkout (`is_selected` logic)
* **Order & Payment:** Full checkout flow with simulated QR payments containing order code and amount. Order statuses: `pending`, `confirmed`, `shipping`, `completed`, `cancelled`

---

## 🤖 AI Recommendation System
The system integrates AI at three distinct touchpoints:

1. **Onboarding (Cold Start):** Maps new user preferences (flavors, brewing methods) to product tags for immediate recommendations
2. **Contextual Recommendation:** Batch processing of user behavior (views, clicks, purchases) to select Top 5 products, with LLM-generated personalized sales pitches
3. **Cross-Selling (Checkout):** Suggests complementary items (e.g., Filter Paper for a V60 Dripper) based on pre-defined product pairings

---

## 🗄 Database Design

### Core Tables
* **users:** `id`, `full_name`, `email`, `password_hash`, `phone`, `address`, `role`, `must_change_password`, `timestamps`
* **categories:** `id`, `name`, `description`, `timestamps`
* **products:** `id`, `category_id`, `name`, `description`, `price`, `stock_quantity`, `flavor`, `status`, `image_url`, `timestamps`
* **carts & cart_items:** Tracks user selections and quantities; includes `is_selected` for checkout
* **orders & order_items:** Stores transaction details, receiver info, status, and snapshots of product price/name at time of purchase
* **payments:** `id`, `order_id`, `method`, `amount`, `qr_content`, `status`, `paid_at`, `timestamps`
* **inventory_logs:** Tracks stock changes (type, quantity, note, creator)

### AI-Related Tables
* **user_preferences:** Stores preferred flavors and brewing methods from onboarding
* **product_tags & product_tag_items:** Used to map products to specific characteristics for AI matching
* **user_behaviors:** Logs interaction types (`view`, `search`, `add_to_cart`, `purchase`)
* **recommendation_logs:** Caches generated recommendations and LLM-generated titles/pitches
* **product_pairings:** Stores `source_product_id`, `target_product_id`, and `ai_pitch` for cross-selling

### Main Relationships
* One user has many orders and one cart
* One cart/order has many items
* One category has many products
* Products and tags have a many-to-many relationship
* One order has one payment

---

## 🎯 Current Scope & Roadmap

* **Must Have:** Full Auth, Product/Inventory CRUD, Cart, Checkout, Order management, QR simulation
* **Should Have:** Search/Filtering, Low stock warnings, Recommendation system
* **Implementation Priority:** 1. Database → 2. Auth → 3. Product CRUD → 4. Cart → 5. Order → 6. Payment → 7. Inventory → 8. Recommendation

---

## ✅ Tiến độ hiện tại (đã làm)

> **Lưu ý:** Dự án mới code **một phần khu Admin**. **Toàn bộ UI Customer (cửa hàng / mua hàng) chưa có** — Register tạo `customer` nhưng chưa có trang nào cho khách sau đăng nhập.

### Backend

| Hạng mục | Trạng thái |
|----------|------------|
| Database models (core + AI) | ✅ |
| Auth: register, login, `GET /auth/me` | ✅ |
| Product CRUD + list/search/filter API | ✅ |
| Categories list API | ✅ |
| Upload ảnh | ✅ |
| Cart / Order / Payment / Inventory API | ❌ |
| AI recommendation API | ❌ |

### Frontend — tách Admin vs Customer

| Khu vực | Trang / thành phần | Trạng thái |
|---------|-------------------|------------|
| **Chung** | `Login.jsx`, `Register.jsx` | ✅ (dùng chung; customer chưa có đích đến sau login) |
| **Admin** | `AdminRoute` — chặn non-admin | ✅ |
| **Admin** | `AdminLayout.jsx` — sidebar | ✅ (khung layout) |
| **Admin** | `AdminProducts.jsx` — CRUD sản phẩm | ✅ |
| **Admin** | Sidebar **Quản lý kho** | ❌ chỉ label, chưa page |
| **Admin** | Sidebar **Đơn hàng** | ❌ chỉ label, chưa page |
| **Admin** | Lọc category / status trên danh sách SP | ❌ |
| **Customer** | `CustomerRoute`, `CustomerLayout` | ❌ **chưa code** |
| **Customer** | Catalog `/shop` | ❌ **chưa code** |
| **Customer** | Chi tiết sản phẩm | ❌ **chưa code** |
| **Customer** | Giỏ hàng `/cart` | ❌ **chưa code** |
| **Customer** | Checkout / thanh toán QR | ❌ **chưa code** |
| **Customer** | Lịch sử đơn / profile | ❌ **chưa code** |

**Tài khoản mặc định (admin seed):**
* Email: `admin@meocoffee.com` (hoặc `admin@meocoffee.local` nếu DB cũ)
* Password: `123456`

**Cấu trúc route FE hiện tại (`App.jsx`):**
```
/              → redirect /login
/login         → Login
/register      → Register
/admin/*       → AdminProducts (có AdminRoute)
( chưa có route /shop, /cart, ... )
```

---

## 📋 Kế hoạch triển khai tiếp theo

Kế hoạch chia **3 luồng song song**: (A) hoàn thiện Admin UI, (B) xây mới **toàn bộ** Customer UI từ đầu, (C) Backend API phục vụ cả hai. Mỗi màn Customer cần **layout + route + gọi API** — hiện **0%**.

---

### Luồng A — Hoàn thiện Admin UI (phần còn lại)

Admin đã có **Sản phẩm**; cần làm nốt menu sidebar và polish.

| Phase | Màn hình | Việc cần làm |
|-------|----------|--------------|
| A1 | **Sản phẩm** (đã có) | Lọc theo `category_id`, `status`; set `product.status` khi hết hàng; chọn category rõ cho tab Coffee |
| A2 | **Quản lý kho** `/admin/inventory` | Form nhập/xuất/điều chỉnh tồn; bảng `inventory_logs`; cảnh báo tồn thấp |
| A3 | **Đơn hàng** `/admin/orders` | Danh sách đơn; filter `status`; chi tiết đơn; đổi trạng thái (`pending` → … → `completed`) |
| A4 | **Admin polish** | Nối sidebar → route (`react-router` nested); đăng xuất; (tuỳ chọn) đổi mật khẩu admin |

**File gợi ý cần tạo:**
```
Frontend/src/pages/admin/
  AdminProducts.jsx    (đã có — có thể move)
  AdminInventory.jsx
  AdminOrders.jsx
  AdminOrderDetail.jsx
```

---

### Luồng B — Customer UI (xây mới 100% — chưa có gì)

Đây là **khu bán hàng Meo Coffee** cho `role=customer`. Cần layout riêng (không dùng `AdminLayout`).

#### B0 — Nền tảng Customer (làm trước)

- [ ] `components/CustomerRoute.jsx` — chỉ `customer`, redirect admin về `/admin`
- [ ] `pages/customer/CustomerLayout.jsx` — header (logo, search, icon giỏ), footer, nav
- [ ] Cập nhật `Login.jsx`: admin → `/admin`, customer → `/shop`
- [ ] Cập nhật `App.jsx` — nhóm route `/shop/*` bọc `CustomerRoute`

**Route map dự kiến:**
```
/shop                    → Trang chủ / catalog
/shop/products/:id       → Chi tiết sản phẩm
/cart                    → Giỏ hàng
/checkout                → Thanh toán (form người nhận)
/orders                  → Đơn của tôi
/orders/:id              → Chi tiết đơn + trạng thái
/payment/:orderId        → Màn QR giả lập
/profile                 → Sửa thông tin cá nhân
```

#### B1 — Duyệt & mua sản phẩm

| Màn | Chức năng UI |
|-----|----------------|
| **Catalog** `/shop` | Grid sản phẩm; search; lọc category / coffee vs equipment; chỉ hiện `status=active` |
| **Chi tiết** `/shop/products/:id` | Ảnh, giá, mô tả, tồn kho; nút **Thêm vào giỏ**; (sau) ghi hành vi `view` |

*Phụ thuộc API:* `GET /products` (đã có), Cart API (luồng C).

#### B2 — Giỏ hàng

| Màn | Chức năng UI |
|-----|----------------|
| **Giỏ** `/cart` | List `cart_items`; +/- quantity; checkbox `is_selected`; xóa item; tổng tiền các món đã chọn; nút **Thanh toán** |

*Phụ thuộc API:* Cart CRUD (luồng C).

#### B3 — Đặt hàng & thanh toán

| Màn | Chức năng UI |
|-----|----------------|
| **Checkout** `/checkout` | Form: họ tên, SĐT, địa chỉ; xác nhận danh sách món đã chọn; tạo đơn |
| **QR** `/payment/:orderId` | Hiển thị `qr_content`, số tiền, mã đơn; nút demo “Đã thanh toán” |
| **Đơn của tôi** `/orders` | List đơn + badge trạng thái |
| **Chi tiết đơn** `/orders/:id` | Items, tổng tiền, trạng thái vận chuyển, trạng thái thanh toán |

*Phụ thuộc API:* Order + Payment (luồng C).

#### B4 — Tài khoản khách

| Màn | Chức năng UI |
|-----|----------------|
| **Profile** `/profile` | Xem/sửa `full_name`, `phone`, `address`; đổi mật khẩu |
| **Register flow** | Sau đăng ký → login → `/shop` (không vào admin) |

#### B5 — Customer + AI (Should Have — sau khi B1–B4 ổn)

- [ ] `/onboarding` — chọn hương vị / phương phá pha (lần đầu)
- [ ] Block **Gợi ý cho bạn** trên `/shop`
- [ ] Gợi ý **mua kèm** trên `/checkout`

**File gợi ý cần tạo (toàn bộ mới):**
```
Frontend/src/pages/customer/
  CustomerLayout.jsx
  ShopHome.jsx
  ProductDetail.jsx
  Cart.jsx
  Checkout.jsx
  Payment.jsx
  OrderList.jsx
  OrderDetail.jsx
  Profile.jsx
  (Onboarding.jsx — phase sau)
```

---

### Luồng C — Backend API (theo thứ tự nghiệp vụ)

API làm **trước hoặc song song** từng nhóm để nối UI Customer/Admin.

| Phase | API | Phục vụ UI |
|-------|-----|------------|
| C1 | **Cart** — `GET/POST/PATCH/DELETE /cart/...` | Customer B2 |
| C2 | **Order** — checkout, list, detail, admin update status | Customer B3 + Admin A3 |
| C3 | **Payment** — tạo QR, confirm giả lập | Customer B3 + Admin A3 |
| C4 | **Inventory** — adjust + logs | Admin A2 |
| C5 | **Auth** — `PATCH /auth/me`, change password | Customer B4 |
| C6 | **AI** — tags, preferences, recommendations | Customer B5 |

**Chi tiết Cart (C1):**
- [ ] `GET /cart` — giỏ + items + product embed
- [ ] `POST /cart/items` — thêm / gộp quantity
- [ ] `PATCH /cart/items/{id}` — `quantity`, `is_selected`
- [ ] `DELETE /cart/items/{id}`
- [ ] Validate `stock_quantity`

**Chi tiết Order (C2):**
- [ ] `POST /orders/checkout` — từ items `is_selected=true`; snapshot giá/tên; trừ kho
- [ ] `GET /orders` — customer (của mình) / admin (tất cả + filter)
- [ ] `GET /orders/{id}`, `PATCH /orders/{id}/status` (admin)

**Chi tiết Payment (C3):**
- [ ] Tạo `Payment` khi checkout; `GET` + `POST .../confirm` giả lập paid

**Chi tiết Inventory (C4):**
- [ ] `POST /inventory/adjust`, `GET /inventory/logs`; auto `product.status`

---

### Luồng D — DevOps & chất lượng (cuối / song song)

- [ ] README root: PostgreSQL, `pip install -r requirements.txt`, `uvicorn`, `npm run dev`
- [ ] Alembic migrations hoặc document `scripts/reset_db.py`
- [ ] Validation upload (MIME, size)
- [ ] Pytest: auth, cart, checkout
- [ ] Production: `SECRET_KEY`, CORS

---

## 📊 Thứ tự ưu tiên đề xuất

```
                    ┌─────────────────────────────────────┐
                    │  ĐÃ XONG (~30% tổng dự án FE)       │
                    │  Admin: Login, Products CRUD        │
                    │  Customer UI: 0%                    │
                    └─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
   C1 Cart API                   B0 Customer shell              A2–A3 Admin
        │                        (Route + Layout + App)         Inventory/Orders
        └──────────────┬─────────┘                             (khi có API)
                       ▼
              B1 Catalog + B2 Cart UI
                       │
                       ▼
              C2 Order → B3 Checkout/QR/Orders
                       │
                       ▼
              C3 Payment ──► C4 Inventory (Admin A2)
                       │
                       ▼
              B4 Profile (C5) ──► B5 AI (C6)
```

**Gợi ý sprint ngắn:**
1. **C1 + B0 + B1** — customer vào được `/shop`, xem & thêm giỏ  
2. **B2 + C2** — giỏ hoàn chỉnh + checkout  
3. **B3 + C3** — QR + lịch sử đơn  
4. **C4 + A2 + A3** — admin kho & đơn hàng  
5. **B4, B5, D** — profile, AI, devops  

---

## 📌 Development Notes

* **AI Focus:** Prioritize practical business workflows and recommendation logic over complex chatbots or heavy ML training
* **Goal:** Demonstrate clean architecture and scalable fullstack engineering
* **Roles:** Chỉ **một** admin mặc định (seed). Mọi tài khoản **Register** đều là `customer` — không tạo admin qua UI.