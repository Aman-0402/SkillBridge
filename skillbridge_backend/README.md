# SkillBridge Backend

Django REST API + WebSocket server for the ConsultME platform.

---

## Stack

- **Django 4.2** + **Django REST Framework 3.14**
- **simplejwt 5.3** — JWT authentication
- **Django Channels 4.1** + **Daphne** — WebSocket support
- **channels-redis 4.1** — channel layer
- **Celery 5.3** + **Redis** — async tasks
- **MySQL** (utf8 charset — no utf8mb4, no emoji in system text)

---

## Setup

```bash
python -m venv venv
venv\Scripts\activate   # Windows / source venv/bin/activate on Linux

pip install -r requirements.txt

# Create .env (see below)
python manage.py migrate
python manage.py createsuperuser

# Run with WebSocket support
daphne -p 8000 skillbridge.asgi:application

# Or standard dev server (no WebSocket)
python manage.py runserver
```

### .env

```env
SECRET_KEY=your-secret-key
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

## Folder Structure

```
skillbridge_backend/
├── skillbridge/          # settings, urls, asgi, wsgi
├── users/                # User model, auth, skills, experience, KYC
├── projects/             # Project + Proposal models
├── jobs/                 # Job + JobApplication models
├── proposals/            # Payment, Transaction, EscrowWallet, Withdrawal
├── consultations/        # ConsultationSession, ConsultantAvailability,
│                         # ConsultantPackage, ConsultantSessionRate,
│                         # RescheduleRequest, Review
├── core/                 # Conversation, Message, Notification,
│                         # analytics, admin API, WebSocket consumer
├── manage.py
├── requirements.txt
└── .env
```

---

## Apps & Models

### `users`
- `User` — extended AbstractUser with `role` (client/freelancer/consultant/both/admin), `profile_image`, `bio`, KYC fields
- `UserSkill`, `UserExperience`

### `projects`
- `Project` — title, description, budget, status, deadline
- `Proposal` — bid_amount, status (pending/accepted/rejected/withdrawn)

### `jobs`
- `Job`, `JobApplication`

### `proposals`
- `Payment` — amount, platform_fee, gst_amount, convenience_fee, total_amount, payout_amount, status (pending → in_escrow → completed → released)
- `Transaction` — audit trail for every payment event
- `EscrowWallet` — balance + locked_balance per user
- `Withdrawal`

### `consultations`
- `ConsultationSession` — consultant, client, session_type (video/call/email/in_person), scheduled_date, start_time, end_time, session_cost, status
  - Status flow: `awaiting_approval` → `confirmed` → `rescheduled` → `completed` / `cancelled`
- `ConsultantAvailability` — day_of_week, start_time, end_time, buffer_minutes, max_bookings_per_slot
- `ConsultantSessionRate` — hourly_rate per session_type (unique per consultant+type)
- `ConsultantPackage` — bundled session packages
- `RescheduleRequest` — new_date, new_start_time, new_end_time, message, status (pending/approved/rejected/counter)
- `Review` — rating (1–5), comment, linked to session

### `core`
- `Conversation` — M2M participants
- `Message` — sender, content, created_at
- `Notification` — type, title, message, is_read, related_id (FK to relevant object)

---

## API Endpoints

All prefixed with `/api/`.

### Auth (`/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `register/` | Create account |
| POST | `login/` | Get access + refresh tokens |
| POST | `refresh/` | Refresh access token |
| GET/PATCH | `profile/` | Get or update own profile |
| POST | `change-password/` | Update password |
| GET/POST/DELETE | `skills/` | Manage user skills |
| GET/POST/DELETE | `experiences/` | Manage experience entries |
| GET | `featured-consultants/` | Admin-featured consultants |

### Consultations (`/consultations/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `sessions/` | List / create session |
| POST | `sessions/{id}/confirm_session/` | Consultant approves (posts chat message, notifies client) |
| POST | `sessions/{id}/decline_session/` | Consultant declines with optional reason |
| POST | `sessions/{id}/cancel_session/` | Cancel session |
| POST | `sessions/{id}/complete_session/` | Mark complete — **time-locked** (400 if before end_time) |
| GET | `sessions/my_sessions/` | Sessions for current user (both sides) |
| GET/POST/DELETE | `availability/` | Manage availability slots |
| GET/POST | `reschedule-requests/` | Create reschedule request |
| POST | `reschedule-requests/{id}/respond/` | Approve / reject / counter-propose |
| GET/POST | `session-rates/` | Manage per-type hourly rates |
| GET | `session-rates/consultant_rates/?consultant_id=` | Public rate lookup |
| GET/POST | `packages/` | Session packages |
| GET/POST | `reviews/` | Session reviews |

### Payments (`/proposals/payments/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `create_order/` | Calculate fees, create pending payment (proposal_id or session_id) |
| POST | `mock_pay/` | Simulate payment → funds to escrow |
| POST | `{id}/approve_completion/` | Client marks work complete |
| POST | `{id}/release/` | Admin releases escrow → wallet |
| POST | `{id}/dispute/` | Admin flags dispute |
| POST | `{id}/admin_refund/` | Admin issues refund |
| GET | `my_wallet/` | Current user's EscrowWallet |
| GET | `my_payments/` | Payments made by current user |
| GET | `my_earnings/` | Payments received + withdrawals |
| GET | `invoice/` | Invoice for a payment |
| POST | `request_withdrawal/` | Withdraw from wallet balance |

### Notifications (`/chat/notifications/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `notifications/` | List all notifications for current user |
| POST | `notifications/{id}/mark_read/` | Mark single as read |
| POST | `notifications/mark_all_read/` | Mark all as read |

### Chat (`/chat/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `conversations/` | List conversations |
| POST | `conversations/{id}/mark_as_read/` | Mark messages read |
| GET | `messages/?conversation_id=` | Fetch messages |
| POST | `messages/send_message/` | Send message |

### Analytics (`/chat/analytics/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `dashboard_stats/` | Role-aware stats for current user |
| GET | `my_revenue_chart/` | Monthly earnings (last 6 months) |

---

## Business Logic Notes

### Fee Calculation (`proposals/utils.py`)
```
base_amount        = session_cost or bid_amount
platform_fee       = base_amount × 6%
gst_amount         = platform_fee × 18%
convenience_fee    = base_amount × 1%
total_amount       = base_amount + platform_fee + gst_amount + convenience_fee
payout_amount      = base_amount - platform_fee - gst_amount
```

### Session Cost Calculation
`session_cost = ConsultantSessionRate.hourly_rate × (duration_minutes / 60)`  
Computed server-side in `ConsultationSessionCreateSerializer.validate()`. Never accepted raw from client.

### Session Confirmation Chat Message
When consultant calls `confirm_session`, if a conversation exists between consultant and client, a structured system message is posted:
```
Session Approved
---------------------------
Session: <title>
Type: <type>
Date: <date>
Time: <start> to <end>
Client: <full name>
Consultant: <full name>
---------------------------
Session confirmed. Funds are secured in escrow. ...
```
No emoji — MySQL utf8 charset limitation.

### complete_session Time Guard
```python
session_end = datetime.combine(session.scheduled_date, session.end_time)
if now() < session_end:
    return 400 "Session has not ended yet"
```

### Reschedule Flow
1. `POST /reschedule-requests/` → creates `RescheduleRequest(status=pending)`, sets session to `reschedule_requested`, notifies other party
2. `POST /reschedule-requests/{id}/respond/` with `action=approve` → updates session date/time, sets session to `rescheduled`, notifies requester
3. `action=reject` → session reverts to `confirmed`, notifies requester
4. `action=counter` → creates new `RescheduleRequest` from responder, notifies original requester

---

## WebSocket

`ws://localhost:8000/ws/chat/<room_name>/`

Room name format: `conversation_<id>` (handled by `core/consumers.py`).  
Authentication: JWT token passed in query string or headers.

---

## Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

Key migrations:
- `consultations/0001_initial` — base session + availability models
- `consultations/000X_reschedule_sessionrate` — RescheduleRequest + ConsultantSessionRate
- `core/0005_notification_related_id` — adds `related_id` to Notification
