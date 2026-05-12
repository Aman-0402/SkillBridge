# ConsultME — Professional Consultancy Marketplace

A full-stack consultancy marketplace platform where clients can post projects, book expert sessions, and hire consultants — and consultants can manage their availability, receive proposals, and track earnings.

---

## Tech Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| Styling | Tailwind CSS | 4.x |
| Routing | React Router DOM | 7.x |
| Animation | Framer Motion | 12.x |
| HTTP Client | Axios | 1.x |
| Charts | Recharts | 3.x |
| Icons | react-icons (fa6) | 5.x |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Django | 4.2 |
| REST API | Django REST Framework | 3.14 |
| Authentication | djangorestframework-simplejwt | 5.3 |
| WebSocket | Django Channels + Daphne | 4.1 |
| Channel Layer | channels-redis | 4.1 |
| Task Queue | Celery + Redis | 5.3 |
| Database | MySQL (SQLite fallback) | — |
| Image Processing | Pillow | 10.x |
| Payments | Razorpay | 1.3 |

---

## Project Structure

```
SkillBridge/
├── skillbridge_frontend/        # React + Vite frontend
│   ├── src/
│   │   ├── assets/brand/        # Logo, images
│   │   ├── components/
│   │   │   ├── marketing/       # Header, Footer
│   │   │   ├── ui/              # Button, FeatureCard, SectionHeader, etc.
│   │   │   ├── utils/           # ScrollToTop
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state (login, register, logout)
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── usePageTitle.js
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx # Header + Footer wrapper for marketing pages
│   │   │   └── DashboardLayout.jsx # Sidebar layout for all protected pages
│   │   ├── pages/
│   │   │   ├── marketing/       # HomePage, AboutPage, ServicesPage, ContactPage
│   │   │   ├── dashboard/       # DashboardHome
│   │   │   ├── Login.jsx        # Django JWT login
│   │   │   ├── Register.jsx     # Django JWT register
│   │   │   ├── Profile.jsx
│   │   │   ├── Projects.jsx / ProjectDetail.jsx / CreateProject.jsx / EditProject.jsx
│   │   │   ├── Jobs.jsx / JobDetail.jsx / PostJob.jsx
│   │   │   ├── Consultants.jsx / ConsultantProfile.jsx / ManageAvailability.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Payment.jsx / Earnings.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   └── AdminDashboard.jsx / AdminPanel.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance with JWT interceptors + auto-refresh
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── data.js              # Static data (nav links, services, dashboard mock data)
│   │   ├── App.jsx              # Route definitions
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind v4 import + global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── skillbridge_backend/         # Django backend (untouched)
    ├── skillbridge/             # Project config (settings, urls, asgi, wsgi)
    ├── users/                   # User model, auth endpoints, skills, experience
    ├── projects/                # Project + Proposal models
    ├── jobs/                    # Job + JobApplication models
    ├── proposals/               # Payment + Transaction models
    ├── consultations/           # Availability, ConsultationSession, Review models
    ├── core/                    # Chat, WebSocket consumer, analytics, admin API
    ├── manage.py
    └── requirements.txt
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Client** | Post projects, browse consultants, book sessions, make payments |
| **Freelancer** | Browse projects, submit proposals, apply to jobs, track earnings |
| **Consultant** | Manage availability, receive session bookings, review clients |
| **Admin** | Full platform access, analytics dashboard, manage all entities |

---

## API Endpoints (50+)

All endpoints are prefixed with `/api/`.

| App | Prefix | Key Endpoints |
|-----|--------|---------------|
| Users | `/auth/` | `register/`, `login/`, `refresh/`, `profile/`, `change-password/`, skills CRUD, experiences CRUD |
| Projects | `/projects/` | CRUD, `my-projects/`, accept proposal |
| Proposals | `/proposals/` | CRUD, `my-proposals/`, withdraw |
| Jobs | `/jobs/` | CRUD, `my-jobs/`, accept application |
| Applications | `/applications/` | CRUD, `my-applications/`, update status |
| Payments | `/proposals/payments/` | CRUD, process, refund, `my-payments/`, `my-earnings/` |
| Consultations | `/consultations/` | Availability CRUD, session booking, confirm/cancel/complete, `my-sessions/`, reviews |
| Chat | `/chat/` | Conversations, messages, mark-read |
| Analytics | `/chat/analytics/` | Dashboard stats, admin stats, charts, KPIs |
| Admin API | `/chat/admin/` | CRUD for all entities |

**WebSocket:** `ws://localhost:8000/ws/chat/<room_name>/`

---

## Routes (Frontend)

### Public (with Header + Footer)
| Path | Page |
|------|------|
| `/` | Home |
| `/services` | Services |
| `/about` | About |
| `/contact` | Contact |

### Auth
| Path | Page |
|------|------|
| `/login` | Login (Django JWT) |
| `/register` | Register (Django JWT) |

### Protected (inside Dashboard sidebar)
| Path | Page |
|------|------|
| `/dashboard` | Dashboard overview |
| `/profile` | User profile |
| `/projects` | Project listings |
| `/projects/:id` | Project detail |
| `/create-project` | Create project |
| `/projects/:id/edit` | Edit project |
| `/jobs` | Job board |
| `/jobs/:id` | Job detail |
| `/post-job` | Post a job |
| `/consultants` | Browse consultants |
| `/consultants/:username` | Consultant profile + booking |
| `/manage-availability` | Consultant availability slots |
| `/chat` | Messaging |
| `/payment/:proposalId` | Payment flow |
| `/earnings` | Earnings history |
| `/stats` | Analytics dashboard |
| `/admin/dashboard` | Admin charts (admin only) |
| `/admin/panel` | Admin CRUD panel (admin only) |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Redis (for WebSocket channel layer and Celery)
- MySQL (optional — SQLite works out of the box)

---

### Backend Setup

```bash
cd skillbridge_backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env         # Edit with your DB credentials, secret key, etc.

# Run migrations
python manage.py migrate

# Create a superuser (admin)
python manage.py createsuperuser

# Start the development server (ASGI via Daphne for WebSocket support)
daphne -p 8000 skillbridge.asgi:application

# Or use the standard runserver (no WebSocket)
python manage.py runserver
```

**Optional — start Celery worker (for async tasks):**
```bash
celery -A skillbridge worker --loglevel=info
```

---

### Frontend Setup

```bash
cd skillbridge_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Build for production:**
```bash
npm run build
```

---

### Environment Variables (Backend)

Create `skillbridge_backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (leave blank to use SQLite)
DB_ENGINE=django.db.backends.mysql
DB_NAME=consultme_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# CORS (add your frontend dev URL)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379/0
```

---

## Key Features

- **JWT Authentication** — Access + refresh token flow with automatic silent refresh on 401
- **Role-based access** — Client, Freelancer, Consultant, and Admin roles with separate dashboards
- **Real-time chat** — WebSocket messaging via Django Channels + Redis
- **Consultant booking** — Availability slot management and session booking
- **Project marketplace** — Post projects, submit and accept proposals
- **Job board** — Post jobs, apply, and manage applications
- **Payments** — Razorpay integration (mock flow) with transaction history and earnings tracking
- **Analytics** — Role-aware dashboard stats and admin-only charts (Recharts)
- **Admin panel** — Full CRUD management for all platform entities

---

## Development Notes

- The frontend (`skillbridge_frontend`) and backend (`skillbridge_backend`) are fully decoupled — they communicate only via the REST API and WebSocket.
- The backend **must not be modified** when making frontend changes. All 50+ API endpoints and the Django data model are stable.
- Tailwind CSS v4 is used via the `@tailwindcss/vite` Vite plugin — there is **no** `tailwind.config.js` processing; configuration is CSS-first via `src/index.css`.
- The Axios instance in `src/services/api.js` handles JWT token injection and automatic token refresh transparently for all API calls.

---

## Contact

**ConsultME** — India's smart consultancy marketplace  
Email: info@consultmee.in  
Phone: +91 8317818107  
Address: 2066 2nd Floor, Nazarbaug Palace, Mandvi, Near Mandvi Gate, Vadodara, Gujarat, India 390001
