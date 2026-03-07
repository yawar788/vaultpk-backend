# VaultPK Backend — Setup Guide

## 📁 Files Created
```
backend/
├── server.js                  ← Entry point
├── package.json               ← Dependencies
├── .env.example               ← Environment variables template
├── .gitignore
├── render.yaml                ← Render.com deploy config
├── models/
│   ├── User.js                ← Customer & admin accounts
│   ├── Product.js             ← Wallet products
│   └── Order.js               ← Customer orders
├── routes/
│   ├── auth.js                ← Register, login, profile
│   ├── products.js            ← CRUD + image upload
│   ├── orders.js              ← Place & manage orders
│   └── analytics.js           ← Dashboard stats
└── middleware/
    └── auth.js                ← JWT protect & admin check
```

---

## 🚀 Step-by-Step Local Setup

### 1. Install Node.js
Download from https://nodejs.org (choose LTS version)

### 2. Set up MongoDB Atlas (free database)
1. Go to https://cloud.mongodb.com
2. Create free account → Create a cluster (M0 Free)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like mongodb+srv://...)
5. Replace <password> with your actual password

### 3. Set up Cloudinary (free image hosting)
1. Go to https://cloudinary.com → Sign up free
2. Go to Dashboard → copy Cloud Name, API Key, API Secret

### 4. Create your .env file
```bash
cd backend
cp .env.example .env
# Now open .env and fill in your real values
```

### 5. Install dependencies & run
```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### 6. Test the API
Open browser and go to: http://localhost:5000
You should see: { "message": "🟢 VaultPK API is running!" }

---

## 📡 API Endpoints Summary

### Auth
| Method | Endpoint                    | Access  | Description          |
|--------|-----------------------------|---------|----------------------|
| POST   | /api/auth/register          | Public  | Create account       |
| POST   | /api/auth/login             | Public  | Login                |
| GET    | /api/auth/me                | Private | Get my profile       |
| PUT    | /api/auth/me                | Private | Update profile       |
| PUT    | /api/auth/change-password   | Private | Change password      |

### Products
| Method | Endpoint                    | Access  | Description          |
|--------|-----------------------------|---------|----------------------|
| GET    | /api/products               | Public  | List products        |
| GET    | /api/products/:id           | Public  | Get single product   |
| POST   | /api/products               | Admin   | Add product + images |
| PUT    | /api/products/:id           | Admin   | Update product       |
| DELETE | /api/products/:id           | Admin   | Delete product       |

### Orders
| Method | Endpoint                    | Access  | Description          |
|--------|-----------------------------|---------|----------------------|
| POST   | /api/orders                 | Public  | Place order (guest)  |
| GET    | /api/orders/my              | Private | My orders            |
| GET    | /api/orders                 | Admin   | All orders           |
| GET    | /api/orders/:id             | Private | Single order         |
| PUT    | /api/orders/:id/status      | Admin   | Update status        |
| DELETE | /api/orders/:id             | Admin   | Delete order         |

### Analytics (Admin only)
| Method | Endpoint                         | Description            |
|--------|----------------------------------|------------------------|
| GET    | /api/analytics/summary           | KPI cards              |
| GET    | /api/analytics/sales             | 30-day sales chart     |
| GET    | /api/analytics/top-products      | Best selling wallets   |
| GET    | /api/analytics/orders-by-status  | Order status breakdown |

---

## ☁️ Deploy to Render.com (Free Hosting)

1. Push your backend folder to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Go to Environment tab → Add all your .env variables
6. Click Deploy!

Your API will be live at: https://vaultpk-backend.onrender.com

---

## ✅ Backend Complete! Next Steps:
- Step 2 → Build React Frontend
- Step 3 → Build Admin Dashboard
- Step 4 → Deploy everything
