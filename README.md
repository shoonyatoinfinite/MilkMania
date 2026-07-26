# 🥛 Milk Mania - Dairy Farm Management System

Milk Mania is a premium, state-of-the-art farm management web application designed to track, audit, and analyze daily dairy farm operations. Built with a modern, glassmorphic UI, responsive animations, and multi-lingual support (English & Hindi), it provides real-time visibility into production, sales, ledger collections, and animal wellness.

---

## 🎨 Design Philosophy & Themes
Milk Mania features three shift-based themes that adapt visually to your environment, with complete light/dark mode configurations:
* **☀️ Morning Theme (Morning Shift)**: Fresh cream and soft golden accents reflecting early morning milking.
* **🌙 Evening Theme (Evening Shift)**: Calm blue-sky hues and emerald accents for the afternoon-evening shift.
* **🌑 Midnight Theme (Dark Mode)**: A high-contrast dark theme inspired by the velvet black color of dairy buffaloes paired with pure white milk cream highlights. All charts, tooltips, and gridlines transition dynamically for perfect readability.

---

## 🚀 Core Features & Business Logic

### 1. Daily Production & Animal Logs
* **Buffalo Profiles**: Log and manage profiles of buffaloes, categorized dynamically by status (`ACTIVE` vs `INACTIVE`). Animal selection forms restrict yields to active animals.
* **Milk Yield History**: Log milk yield volume per animal, per shift (Morning/Evening) for any selected date.
* **Home Consumption Options**: Deducts domestic milk requirements from total yields on-the-fly, displaying only the net **Usable Yield** inside the main stats.
* **Duplicate Yield Prevention**: Restricts inputs to ensure a single animal cannot have more than one yield record logged for the same date and shift session.

### 2. Smart Sales & FIFO Dues Matching
* **Stock-Limited Sales**: Rejects sale records that exceed the available milk stock of the selected shift (`Stock = Total Usable Yield - Sales Already Logged`).
* **FIFO Ledger Clearing (First-In, First-Out)**:
  * Payments are matching chronologically against oldest outstanding `PENDING` transactions.
  * Sales are automatically flagged as **✅ PAID**, **⚠️ PARTIAL (Paid ₹X)**, or **💸 PENDING** in real-time as collections are logged.
* **Interactive Customer Analytics Modal**: Clicking on a customer displays:
  * Net liters bought, total bill values, and outstanding dues.
  * A glowing Recharts line graph detailing their last 7 purchase entries.
  * Date-to-Date period filters to dynamically recalculate statistics.

### 3. Shift Stock Carry-Overs & Discards (Adjustments)
* **Adjustments Panel**: Log remaining milk stock at session boundaries:
  * **🗑️ Discard/Empty**: Empties remaining inventory due to spoilage or domestic needs.
  * **🔄 Rollover Carry-Over**: Shifts current available stock into the next session (Morning ➔ Evening, Evening ➔ Tomorrow's Morning).
* **Double Adjustment Prevention**: Backend and frontend guard systems block attempts to discard or roll over stock for any session that has already been adjusted.

### 4. Financial Records & Expense Tracking
* **Ledgers**: Track expenses under multiple tags (`FEED`, `HEALTH`, `LABOR`, `UTILITIES`, `OTHERS`).
* **Visual Reports**: Responsive dashboard and Analytics charts including monthly flow analysis, expense breakdowns (Pie Chart), and revenue trends.

### 5. PDF Ledger Statement Export
* **Previous Balance Calculation**: Automatically calculates the accumulated unpaid balance prior to the selected statement period.
* **PDF Bill Summaries**: Generates high-quality bills containing:
  * Previous Balance (पिछला बकाया)
  * Current Liters Purchased & Value
  * Total Collections Deposited
  * Net Outstanding Balance (कुल बकाया)

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite, TypeScript), Tailwind CSS, Recharts (premium glowing charts with SVG filters), Lucide Icons, Framer Motion.
* **Backend**: Node.js (Express, TypeScript), Prisma ORM (SQLite / PostgreSQL database).
* **PDF Utility**: jsPDF client-side statement renderer.

---

## 📦 Project Directory Structure
```
MILKMANIA/
├── backend/                  # Node.js + Express + Prisma API server
│   ├── prisma/               # Database Schema and Migrations
│   ├── src/
│   │   ├── routes/           # REST Endpoints (Sales, Production, Payments)
│   │   └── server.ts         # Entry point
│   └── package.json
│
├── frontend/                 # React client application
│   ├── src/
│   │   ├── components/       # Common layouts (Navbar, LiquidProgress)
│   │   ├── context/          # AppContext state manager (Axios wrappers)
│   │   ├── pages/            # Core views (Dashboard, Sales, Customers)
│   │   ├── utils/            # Translation keys & Local date utilities
│   │   └── index.css         # Glassmorphism patterns & theme definitions
│   └── package.json
└── README.md
```

---

## 💻 Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### 1. Database & Backend Setup
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependency modules:
   ```bash
   npm install
   ```
3. Set up your environment values in `.env`:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db" # SQLite local database path
   JWT_SECRET="your-secure-jwt-key"
   ```
4. Run Prisma database migrations to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend client Setup
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependency modules:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌍 Language Translations
Toggle between English and Hindi translation sets at any time. Hindi strings are optimized for local dairy operations using native terms (e.g. *नकद* for Cash, *बकाया* for Dues, *संग्रह* for Collect).

---

## 🛡️ License
Proprietary software for farm inventory control. All rights reserved.
