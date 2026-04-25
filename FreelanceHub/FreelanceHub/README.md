# ⚡ FreelanceHub — Full-Stack Freelance Platform

A full-stack freelance services marketplace built with **Express.js** and vanilla **HTML/CSS/JavaScript**, inspired by platforms like Fiverr and Upwork.

---

## 🚀 Features

### Frontend
- **Home Page** — Hero section, category browsing, featured services
- **Services Listing** — Dynamic grid with real-time search, filter, and sort
- **Service Detail Modal** — Full service info with features, seller profile, ratings
- **User Dashboard** — Saved & hired services with order tracking
- **Drag & Drop** — Drag cards onto Save/Hire drop zones
- **Toast Notifications** — Non-intrusive feedback for every action
- **Responsive Design** — Mobile-first, works on all screen sizes

### Backend (Express.js)
- RESTful API with proper HTTP status codes (200, 201, 400, 404, 409, 500)
- Request validation and error handling middleware
- In-memory data store (syncs with services.json)
- CORS enabled for cross-origin requests
- Static file serving for the frontend

---

## 📁 Project Structure

```
FreelanceHub/
├── client/
│   ├── index.html          # Single-page app (SPA)
│   ├── css/
│   │   └── style.css       # All styles (CSS variables, grid, flex, responsive)
│   └── js/
│       └── app.js          # All frontend logic (fetch, DOM, state)
├── server/
│   ├── server.js           # Express app entry point
│   ├── routes/
│   │   └── api.js          # All route definitions
│   ├── controllers/
│   │   └── servicesController.js  # Business logic
│   └── data/
│       └── services.json   # Seed data (12 services)
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | Get all services (supports filters) |
| `GET` | `/api/services/:id` | Get single service by ID |
| `POST` | `/api/services` | Add a new service |
| `POST` | `/api/save` | Save a service |
| `DELETE` | `/api/save/:id` | Remove from saved |
| `GET` | `/api/saved` | Get all saved services |
| `POST` | `/api/hire` | Hire a service |
| `GET` | `/api/hired` | Get all hired services |
| `GET` | `/api/categories` | Get all categories |
| `GET` | `/api/health` | Health check |

### Query Parameters for `GET /api/services`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by title or tags |
| `category` | string | Filter by category |
| `sort` | string | `price_asc`, `price_desc`, `rating`, `popular` |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `minRating` | number | Minimum rating filter |

### Example Requests

```bash
# Get all services
curl http://localhost:3000/api/services

# Search + filter
curl "http://localhost:3000/api/services?search=logo&category=Design&sort=rating"

# Save a service
curl -X POST http://localhost:3000/api/save \
  -H "Content-Type: application/json" \
  -d '{"serviceId": 1}'

# Hire a service
curl -X POST http://localhost:3000/api/hire \
  -H "Content-Type: application/json" \
  -d '{"serviceId": 2, "message": "Looking forward to working with you!"}'

# Add a new service
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{"title":"My Service","category":"Design","description":"Great service","price":100,"seller":"John Doe"}'
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v14 or higher
- **npm** v6 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/FreelanceHub-FullStack.git
cd FreelanceHub-FullStack

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
open http://localhost:3000
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Data | JSON file + In-memory arrays |
| Styling | CSS Grid, Flexbox, CSS Variables |
| Fonts | Syne (display), DM Sans (body) |

---

## 📐 Architecture

```
Browser (Client)
    │
    │  fetch() API calls
    ▼
Express.js Server (port 3000)
    │
    ├── Static Files (/client)
    │
    └── /api routes
            │
            ├── servicesController.js
            │       │
            │       └── services.json (read/write)
            │
            └── In-memory arrays
                    ├── savedServices[]
                    └── hiredServices[]
```

---

## 🎨 Design System

- **Theme**: Dark mode with indigo accent (`#6c63ff`)
- **Typography**: Syne (headings) + DM Sans (body)
- **Grid**: CSS Grid for cards, Flexbox for components
- **Animations**: CSS keyframes, cubic-bezier transitions
- **Responsive**: Mobile-first breakpoints at 480px, 768px

---

## 📝 License

MIT — Free to use and modify.
