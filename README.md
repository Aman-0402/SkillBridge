# ConsultME — Professional Consultancy Marketplace

A full-stack consultancy marketplace where clients post projects, book expert sessions, and manage payments — and consultants manage availability, sessions, proposals, and earnings.

---

## Tech Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router DOM | 7.x |
| Animation | Framer Motion | 12.x |
| HTTP Client | Axios | 1.x |
| Charts | Recharts | 3.x |
| Icons | react-icons (fa6) | 5.x |
| Dialogs | SweetAlert2 | 11.x |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Django | 4.2 |
| REST API | Django REST Framework | 3.14 |
| Authentication | djangorestframework-simplejwt | 5.3 |
| WebSocket | Django Channels + Daphne | 4.1 |
| Channel Layer | channels-redis | 4.1 |
| Task Queue | Celery + Redis | 5.3 |
| Database | MySQL (utf8 charset) | — |
| Image Processing | Pillow | 10.x |

> **Note:** MySQL uses `utf8` charset (not `utf8mb4`). Emoji in backend-generated text is avoided — use plain text only in system messages.

---

## Project Structure

```
SkillBridge/
├── skillbridge_frontend/        # React + Vite frontend
│   ├── src/
│   │   ├── assets/brand/
│   │   ├── components/
│   │   │   ├── marketing/       # Header, Footer
│   │   │   ├── ui/              # Button, FeatureCard, SectionHeader
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── usePageTitle.js
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   └── DashboardLayout.jsx  # Sidebar + notification bell
│   │   ├── pages/
│   │   │   ├── marketing/       # HomePage, AboutPage, ServicesPage, ContactPage
│   │   │   ├── dashboard/       # DashboardHome (role-aware stats + banner)
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── Profile.jsx      # Includes session rate management
│   │   │   ├── Projects.jsx / ProjectDetail.jsx / CreateProject.jsx / EditProject.jsx
│   │   │   ├── Jobs.jsx / JobDetail.jsx / PostJob.jsx
│   │   │   ├── Consultants.jsx / ConsultantProfile.jsx
│   │   │   ├── ManageAvailability.jsx  # Sessions + reschedule system
│   │   │   ├── Chat.jsx         # Real-time chat with system message cards
│   │   │   ├── Notifications.jsx  # Full notifications page
│   │   │   ├── Payment.jsx / Earnings.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   └── AdminDashboard.jsx / AdminPanel.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios with JWT interceptors + auto-refresh
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
└── skillbridge_backend/
    ├── skillbridge/             # settings, urls, asgi, wsgi
    ├── users/                   # User model, auth, skills, experience
    ├── projects/                # Project + Proposal models
    ├── jobs/                    # Job + JobApplication models
    ├── proposals/               # Payment, Transaction, EscrowWallet, Withdrawal
    ├── consultations/           # Availability, ConsultationSession, RescheduleRequest,
    │                            # ConsultantPackage, ConsultantSessionRate, Review
    ├── core/                    # Conversation, Message, Notification, analytics, admin API
    ├── manage.py
    └── requirements.txt
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Client** | Post projects, browse + book consultants, make payments, manage appointments, respond to reschedule requests |
| **Freelancer** | Browse projects, submit proposals, apply to jobs, track earnings |
| **Consultant** | Manage availability, approve/decline sessions, request reschedules, set session rates, complete sessions |
| **Both** | Freelancer + Consultant combined workspace |
| **Admin** | Full platform access, analytics, manage all entities, release/refund escrow |

---

## Features

### Consultation Booking Flow
1. Client visits consultant profile → selects session type + duration → cost auto-calculated from consultant's session rates
2. Session created (`awaiting_approval`) → redirected to Payment
3. Client pays → funds go to escrow
4. Consultant sees request → **Approve** (optional decline reason) or **Decline**
5. On approval: system message posted in existing chat conversation
6. Consultant sees live countdown timer on confirmed session card
7. After session end time passes → "Complete" button unlocks (time-guarded server + client side)
8. Session completed → client leaves review

### Reschedule Request System
- Consultant can request reschedule on any `confirmed` or `rescheduled` session
- Modal with: new date, new start/end time, message field
- **4 pre-built consultant templates** (click to fill): medical emergency, prior commitment, technical issue, personal emergency
- Client receives pending reschedule request card with proposed slot + consultant message
- **3 pre-built client reply templates**: keep original slot, suggest another, cancel
- Client can Approve (session rescheduled) or Decline (session reverts to confirmed)
- All actions trigger notifications to both parties

### Payment & Escrow
- **Step 1:** `create_order` — calculates platform fee (6%), GST (18%), convenience fee (1%)
- **Step 2:** `mock_pay` — simulates payment, funds go to `locked_balance` in EscrowWallet
- **Step 3:** Client approves work completion
- **Step 4:** Admin releases funds from escrow → wallet `balance`
- Supports both project proposals and consultation sessions
- Invoice endpoint for both parties

### Chat System
- Real-time WebSocket messaging (Django Channels + Redis)
- **Session Booking Confirmed** card — auto-posted when client books and pays
- **Session Approved** card — auto-posted when consultant confirms
- Structured info cards (title, type, date, time, client, consultant) instead of plain text bubbles
- Avatar initials with deterministic color per user
- Conversation list with unread count badge

### Notifications
- Dedicated `/notifications` page with filter chips: All / Unread / Session / Proposal / Payment / General
- Grouped by day (Today / Yesterday / named date)
- Click-to-navigate: each notification links to the relevant resource
- Notification bell in sidebar with unread count badge
- Types: `session_booked`, `session_confirmed`, `session_cancelled`, `session_completed`, `reschedule_requested`, `reschedule_responded`, `payment_success`, `payment_released`, `proposal_accepted`, `new_proposal`, `job_application`
- `related_id` field on every notification for deep linking

### Dashboard
- Role-aware stat cards, revenue chart (last 6 months), quick actions
- **Upcoming session banner** — appears for client/consultant/both when a confirmed session starts within 24 hours; shows live countdown + session info; dismissable
- Client finance breakdown: project spend, consultation spend, escrow, released

### Session Rates (Consultant)
- Per-type hourly rates: Video Call, Phone Call, Email/Chat, In Person
- Set in Profile → Session Rates section
- Auto-calculates `session_cost = hourly_rate × (duration_minutes / 60)`

---

## API Endpoints

All prefixed with `/api/`.

| App | Prefix | Key Endpoints |
|-----|--------|---------------|
| Users | `/auth/` | `register/`, `login/`, `refresh/`, `profile/`, `change-password/`, skills, experiences, `featured-consultants/` |
| Projects | `/projects/` | CRUD, `my_projects/`, accept proposal |
| Proposals | `/proposals/` | CRUD, `my_proposals/`, withdraw |
| Jobs | `/jobs/` | CRUD, `my-jobs/`, accept application |
| Applications | `/applications/` | CRUD, `my-applications/`, update status |
| Payments | `/proposals/payments/` | `create_order/`, `mock_pay/`, `approve_completion/`, `release/`, `dispute/`, `admin_refund/`, `my_wallet/`, `my_payments/`, `my_earnings/`, `invoice/` |
| Consultations | `/consultations/sessions/` | CRUD, `confirm_session/`, `decline_session/`, `cancel_session/`, `complete_session/`, `my_sessions/` |
| Availability | `/consultations/availability/` | CRUD |
| Reschedule | `/consultations/reschedule-requests/` | CRUD, `respond/` (approve/reject/counter) |
| Session Rates | `/consultations/session-rates/` | CRUD, `consultant_rates/` |
| Packages | `/consultations/packages/` | CRUD, `consultant_packages/` |
| Reviews | `/consultations/reviews/` | CRUD |
| Chat | `/chat/conversations/`, `/chat/messages/` | list, `send_message/`, `mark_as_read/` |
| Notifications | `/chat/notifications/` | list, `mark_read/`, `mark_all_read/` |
| Analytics | `/chat/analytics/` | `dashboard_stats/`, `my_revenue_chart/`, admin charts |
| Admin API | `/chat/admin/` | CRUD for all platform entities |

**WebSocket:** `ws://localhost:8000/ws/chat/<room_name>/`

---

## Frontend Routes

### Public
| Path | Page |
|------|------|
| `/` | Home |
| `/services` | Services |
| `/about` | About |
| `/contact` | Contact |

### Auth
| Path | Page |
|------|------|
| `/login` | Login |
| `/register` | Register |

### Protected (Dashboard Sidebar)
| Path | Page |
|------|------|
| `/dashboard` | Dashboard overview with role-aware stats and upcoming session banner |
| `/profile` | User profile + session rate management |
| `/projects` | Project listings |
| `/projects/:id` | Project detail |
| `/create-project` | Create project |
| `/projects/:id/edit` | Edit project |
| `/jobs` | Job board |
| `/jobs/:id` | Job detail |
| `/post-job` | Post a job |
| `/consultants` | Browse consultants |
| `/consultants/:username` | Consultant profile + booking |
| `/manage-availability` | Session management + reschedule system |
| `/chat` | Messaging with system message cards |
| `/notifications` | Full notifications page |
| `/payment/:id` | Payment flow (project or session) |
| `/earnings` | Earnings + wallet + withdrawal |
| `/stats` | Analytics dashboard |
| `/admin/dashboard` | Admin charts (admin only) |
| `/admin/panel` | Admin CRUD panel (admin only) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis
- MySQL

### Backend Setup

```bash
cd skillbridge_backend

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Configure .env (see Environment Variables below)
python manage.py migrate
python manage.py createsuperuser

# Start server (with WebSocket support)
daphne -p 8000 skillbridge.asgi:application

# Or standard (no WebSocket)
python manage.py runserver
```

Optional — Celery worker:
```bash
celery -A skillbridge worker --loglevel=info
```

### Frontend Setup

```bash
cd skillbridge_frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build
```

---

## Environment Variables

Create `skillbridge_backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.mysql
DB_NAME=consultme_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173

REDIS_URL=redis://localhost:6379/0
```

---

## Development Notes

- Frontend and backend are fully decoupled — REST API + WebSocket only.
- Axios instance in `src/services/api.js` handles JWT injection and silent refresh on 401.
- MySQL `utf8` charset — backend system messages must not contain emoji (stored as `????`). Use plain text only.
- `complete_session` is time-locked: server returns 400 if called before `scheduled_date + end_time`.
- Reschedule flow: `RescheduleRequest` creates a new DB record + sets session to `reschedule_requested`. Responding sets session back to `confirmed` (reject) or `rescheduled` (approve).
- Payment `session_cost` is always computed server-side from `ConsultantSessionRate` — never accepted raw from client.

---

## Contact

**ConsultME** — India's smart consultancy marketplace  
Email: info@consultmee.in  
Phone: +91 8317818107  
Address: 2066 2nd Floor, Nazarbaug Palace, Mandvi, Near Mandvi Gate, Vadodara, Gujarat, India 390001
