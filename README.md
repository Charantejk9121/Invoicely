# Invoicely — Modern Invoice Generator & Business Dashboard

A full-stack SaaS-style invoicing application built with React, Node.js, MongoDB, and JWT authentication.

---

## 🗂 Project Structure

```
invoicely/
├── backend/              # Node.js + Express API
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express route handlers
│   ├── middleware/       # JWT auth middleware
│   └── server.js         # Entry point
└── frontend/             # React + Vite + Tailwind
    └── src/
        ├── pages/        # Route-level page components
        ├── components/   # Reusable UI components
        ├── context/      # Auth & Theme context
        ├── utils/        # API, formatting, PDF generation
        └── styles/       # Global CSS & Tailwind
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string

---

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your values:
# MONGO_URI=mongodb://localhost:27017/invoicely
# JWT_SECRET=your_super_secret_key_here
# PORT=5000
# CLIENT_URL=http://localhost:5173

npm run dev
```

The API will start at **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **http://localhost:5173**

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Invoices
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/invoices` | List invoices (filter, paginate) |
| GET | `/api/invoices/:id` | Get single invoice |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PATCH | `/api/invoices/:id/status` | Update status |

### Clients
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/clients` | List clients |
| GET | `/api/clients/:id` | Client + invoice history |
| POST | `/api/clients` | Create client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Analytics, stats, charts data |

---

## ✨ Features

- **JWT Authentication** — Secure signup/login with bcrypt password hashing
- **Dashboard** — Revenue overview, invoice status breakdown, top clients, monthly area chart
- **Invoice Management** — Create, edit, delete invoices with line items
- **GST Calculation** — Auto-calculates CGST+SGST (intra-state) or IGST (inter-state)
- **PDF Export** — Professional invoice PDF via jsPDF with company branding
- **Client Management** — Full client CRUD with invoice history
- **Payment Tracking** — Mark invoices as Paid/Pending/Overdue/Cancelled
- **Dark/Light Mode** — Persistent theme toggle
- **Responsive** — Works on mobile, tablet, and desktop

---

## 🌐 Deployment

### Backend → Render.com
1. Push to GitHub
2. Create new **Web Service** on Render
3. Set root directory to `backend/`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Strong random string
   - `CLIENT_URL` — Your Vercel frontend URL
   - `NODE_ENV=production`

### Frontend → Vercel
1. Import GitHub repo in Vercel
2. Set root directory to `frontend/`
3. Add environment variable:
   - `VITE_API_URL` — Your Render backend URL + `/api`
4. Deploy

---

## 🧰 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Charts | Recharts |
| PDF | jsPDF + jsPDF-AutoTable |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Notifications | React Hot Toast |
| Icons | Lucide React |

---

## 📸 Pages

- `/login` — Sign in page
- `/register` — Create account
- `/dashboard` — Overview with charts and stats
- `/invoices` — Invoice list with filters
- `/invoices/new` — Create invoice
- `/invoices/:id` — Invoice detail + PDF export
- `/invoices/:id/edit` — Edit invoice
- `/clients` — Client cards grid
- `/clients/:id` — Client profile + history
- `/profile` — Account settings
