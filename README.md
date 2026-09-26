# 🥛 Milk Mania — Smart Dairy Record Manager

<p align="center">
  <img src="frontend/public/icon-512.png" alt="Milk Mania Logo" width="120" height="120" style="border-radius:24px"/>
</p>

<p align="center">
  <b>A premium, PWA-ready dairy buy & sell record-keeping app with a dedicated customer portal.</b><br/>
  Bilingual (English & Hindi) · Offline-capable · Mobile-first · Role-based access
</p>

---

## ✨ What is Milk Mania?

Milk Mania is a **full-stack dairy business management system** designed for small to medium dairy operations. It replaces paper ledgers with a clean, modern web app that works on any device — including as an installable PWA on your phone's home screen.

The app is split into two portals:
- **🔐 Admin / Staff Portal** — Full control over buy/sell records, customers, reports, and settings.
- **👤 Customer Portal** — Customers log in with their mobile number + 6-digit PIN to view their own purchase history and dues.

---

## 🚀 Core Features

### 🛒 Buy & Sell Records
- Log milk **purchases** (buying from suppliers) and **sales** (selling to customers)
- Each record captures: **date, shift (Morning/Evening), quantity (litres), rate (₹/litre), and amount**
- **Payment method defaults to "Due"** — easily switch to Cash
- **Shift auto-detects from system time** (Morning before noon, Evening after noon) — can be manually overridden

### 💰 FIFO Dues Ledger
- Payments are matched **chronologically** against oldest outstanding dues
- Transactions are auto-flagged as **✅ Paid**, **⚠️ Partial**, or **💸 Pending**

### 👥 Customer Management
- Register customers with: Name, Mobile Number, Address, and a 6-digit PIN
- Customers can log in to their own portal and view their buy history

### 📊 Analytics & Reports
- Dashboard KPIs: Total Sales, Total Purchases, Net Revenue, Outstanding Dues
- Visual charts for monthly trends and customer-level breakdowns
- Date-range filtered **statement slips** — printable directly from the browser

### 📱 PWA — Installable App
- Install Milk Mania directly on any Android/iOS home screen
- Works offline for viewing cached data
- Auto-hides the install banner after successful installation
- Branded app icon (blue gradient + milk drop + golden crown)

### 🌐 Bilingual Support
- Full **English** and **Hindi** translation across every page and form
- Toggle language from the top navbar at any time

---

## 👤 Customer Portal

Customers access a **dedicated, mobile-first dashboard** at `/customer-login`:

| Feature | Description |
|---|---|
| **Login** | Mobile number + 6-digit PIN (set by admin, changeable by customer) |
| **Today's Summary** | Morning & Evening purchases at a glance |
| **Purchase History** | Date-range filter, shift breakdown, amount & quantity |
| **Dues Overview** | Total outstanding balance |
| **Statement Print** | Printable summary slip with morning/evening totals (no per-log clutter) |
| **PIN Change** | Via ⚙️ settings icon in the header |

---



---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **Charts** | Recharts (glowing SVG-filter charts) |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Prisma ORM → SQLite (dev) / PostgreSQL (prod) |
| **Auth** | JWT (admin) + PIN-based (customer) |
| **PWA** | Vite PWA plugin, Web App Manifest, Service Worker |

---

## 📂 Project Structure

```
MILKMANIA/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # DB schema (Users, Customers, Sales, Purchases)
│   └── src/
│       ├── routes/
│       │   ├── sales.ts          # Sell records API
│       │   ├── milkBought.ts     # Buy records API
│       │   ├── customers.ts      # Customer management
│       │   ├── customerPortal.ts # Customer portal login & data
│       │   ├── dashboard.ts      # KPI aggregations
│       │   ├── expenses.ts       # Expense tracking
│       │   └── settings.ts       # App settings & user management
│       └── index.ts              # Express server entry point
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json         # PWA manifest
│   │   ├── icon-192.png          # PWA icon (192x192)
│   │   ├── icon-512.png          # PWA icon (512x512)
│   │   ├── apple-touch-icon.png  # iOS home screen icon
│   │   ├── favicon.png           # Browser tab icon
│   │   └── sw.js                 # Service Worker
│   └── src/
│       ├── components/
│       │   └── Navbar.tsx        # Top navigation bar
│       ├── context/
│       │   ├── AppContext.tsx     # Admin app state & API wrappers
│       │   └── CustomerAuthContext.tsx  # Customer auth state
│       ├── pages/
│       │   ├── Login.tsx         # Admin/staff login
│       │   ├── Dashboard.tsx     # KPI overview
│       │   ├── Sales.tsx         # Buy & sell records
│       │   ├── Customers.tsx     # Customer management
│       │   ├── Analytics.tsx     # Charts & trends
│       │   ├── Reports.tsx       # Filterable reports
│       │   ├── Settings.tsx      # App & user settings
│       │   ├── CustomerLogin.tsx # Customer portal login
│       │   └── CustomerDashboard.tsx  # Customer portal dashboard
│       ├── utils/
│       │   └── translations.ts   # EN + HI string maps
│       └── index.css             # Global styles & design tokens
└── README.md
```

---

## 💻 Setup & Installation

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-jwt-secret-here"
```

Run migrations & start:
```bash
npx prisma migrate dev --name init
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Admin login:** `admin@milkmania.com` / `admin123`

---

## 📱 Installing as PWA

1. Open the app in Chrome (Android) or Safari (iOS)
2. Tap the **"Install Milk Mania App"** banner that appears
3. The app installs to your home screen with the branded blue icon
4. The install banner auto-hides after successful installation

---

## 🌍 Language Support

Switch between **English** and **हिंदी** at any time using the language toggle in the navbar. All UI text, form labels, error messages, and print slips are fully translated.

---

## 🛡️ License

Proprietary software. All rights reserved © Milk Mania.
