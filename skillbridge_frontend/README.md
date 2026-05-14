# SkillBridge Frontend

React + Vite frontend for the ConsultME platform.

---

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 3** — utility-first styling
- **React Router DOM 7** — client-side routing
- **Axios** — HTTP client with JWT interceptors
- **Recharts** — dashboard charts
- **Framer Motion** — animations
- **SweetAlert2** — dialogs and confirmations
- **react-icons/fa6** — icons

---

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
```

Backend must be running on `http://localhost:8000`. The Vite dev proxy is configured in `vite.config.js`.

---

## Folder Structure

```
src/
├── assets/brand/            # Logo, images
├── components/
│   ├── marketing/           # Header, Footer
│   ├── ui/                  # Button, FeatureCard, SectionHeader
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx      # JWT login/register/logout state
├── hooks/
│   ├── useAuth.js
│   └── usePageTitle.js
├── layouts/
│   ├── PublicLayout.jsx     # Marketing pages wrapper
│   └── DashboardLayout.jsx  # Sidebar + notification bell + nav
├── pages/
│   ├── marketing/           # HomePage, AboutPage, ServicesPage, ContactPage
│   ├── dashboard/
│   │   └── DashboardHome.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Profile.jsx
│   ├── Projects.jsx / ProjectDetail.jsx / CreateProject.jsx / EditProject.jsx
│   ├── Jobs.jsx / JobDetail.jsx / PostJob.jsx
│   ├── Consultants.jsx
│   ├── ConsultantProfile.jsx
│   ├── ManageAvailability.jsx
│   ├── Chat.jsx
│   ├── Notifications.jsx
│   ├── Payment.jsx
│   ├── Earnings.jsx
│   ├── DashboardStats.jsx
│   ├── AdminDashboard.jsx
│   └── AdminPanel.jsx
├── services/
│   └── api.js               # Axios instance, JWT interceptors, silent refresh
├── App.jsx                  # All route definitions
└── index.css                # Tailwind directives + global styles
```

---

## Routes

### Public
| Path | Component |
|------|-----------|
| `/` | `HomePage` |
| `/services` | `ServicesPage` |
| `/about` | `AboutPage` |
| `/contact` | `ContactPage` |
| `/login` | `Login` |
| `/register` | `Register` |

### Protected (require auth, rendered inside `DashboardLayout`)
| Path | Component | Notes |
|------|-----------|-------|
| `/dashboard` | `DashboardHome` | Role-aware stats, upcoming session banner |
| `/profile` | `Profile` | Session rate management for consultants |
| `/projects` | `Projects` | |
| `/projects/:id` | `ProjectDetail` | |
| `/create-project` | `CreateProject` | Client only |
| `/projects/:id/edit` | `EditProject` | |
| `/jobs` | `Jobs` | |
| `/jobs/:id` | `JobDetail` | |
| `/post-job` | `PostJob` | |
| `/consultants` | `Consultants` | |
| `/consultants/:username` | `ConsultantProfile` | Booking form |
| `/manage-availability` | `ManageAvailability` | Consultant: sessions + reschedule; Client: appointments |
| `/chat` | `Chat` | Real-time messaging with system message cards |
| `/notifications` | `Notifications` | Full page, filterable, click-to-navigate |
| `/payment/:id` | `Payment` | Project or session payment |
| `/earnings` | `Earnings` | Wallet, earnings, withdrawals |
| `/stats` | `DashboardStats` | Analytics charts |
| `/admin/dashboard` | `AdminDashboard` | Admin only |
| `/admin/panel` | `AdminPanel` | Admin only |

---

## Key Components

### `DashboardLayout.jsx`
- Sidebar navigation with role-aware links
- Notification bell with unread count badge
- Notification dropdown (last 10, click-to-navigate, mark-all-read)
- `getNotifLink(type, related_id)` maps notification type to destination URL

### `DashboardHome.jsx`
- Role-aware stat cards (`buildStatCards`)
- **Upcoming session banner** — fetches `my_sessions`, filters `confirmed` sessions starting within 24h, shows live countdown + partner name + dismiss button
- Revenue area chart (last 6 months, Recharts)
- Role-specific bottom panels: `ClientPanels`, `FreelancerPanels`, `ConsultantPanels`, `BothPanels`, `AdminPanels`
- Client finance breakdown: project spend, consultation spend, escrow, released

### `ManageAvailability.jsx`
Two views, role-selected:

**Consultant view (`ConsultantAvailability`):**
- Add/delete availability slots (day, start, end, buffer, max bookings)
- Session list with live countdown on confirmed/rescheduled sessions
- Approve/Decline buttons for `awaiting_approval` sessions
- **Complete button time-locked** — grayed + Swal warning if before `end_time`; unlocks after session end
- **"Request Reschedule" button** on confirmed/rescheduled sessions → opens `RescheduleModal`
- `reschedule_requested` sessions show "Awaiting client response" label

**`RescheduleModal` component:**
- New date picker (min = today), start/end time inputs
- 4 quick-pick template buttons (click fills message textarea):
  - Medical emergency
  - Unavoidable prior commitment
  - Technical issue
  - Personal emergency
- POST to `/consultations/reschedule-requests/`

**Client view (`ClientAppointments`):**
- Pending reschedule requests section (from consultant) appears when requests exist
- `RescheduleRequestCard` per pending request:
  - Shows proposed new slot + consultant message
  - 3 quick-reply templates: keep original / suggest another / cancel
  - Approve → `respond` action with `action=approve`
  - Decline → `respond` action with `action=reject` + optional message
- Session list with review flow for completed sessions

### `Chat.jsx`
- Sidebar: conversation list, unread count, search
- `isSystemMessage(content)` — detects `Session Booking Confirmed` or `Session Approved` prefixes
- `SessionCard` — renders system messages as structured info cards (not chat bubbles), title dynamic per type
- `Avatar` — initials with deterministic color hash
- `displayName(p)` — `first_name + last_name || username`
- Auto-scroll to bottom on new messages
- Mark-as-read on conversation open

### `Notifications.jsx`
- Filter chips: All / Unread / Session / Proposal / Payment / Job / KYC / General
- Grouped by day: Today / Yesterday / named date
- `getLink(type, related_id)` — maps each type to destination URL
- Unread accent bar, colored icon, type pill per notification
- Mark single read on click; mark-all-read button

### `Countdown` component (ManageAvailability)
- Props: `date`, `startTime`
- Updates every second via `setInterval`
- `Xd Yh away` — more than 24h out
- `HH:MM:SS` — same day, blue; amber when under 1 hour
- `Session started` — when past start time

---

## Auth Flow

`AuthContext` stores `user` + `tokens` in `localStorage`.  
`api.js` Axios interceptor:
1. Attaches `Authorization: Bearer <access>` to every request
2. On 401: attempts silent refresh via `POST /api/auth/refresh/`
3. On refresh failure: clears tokens + redirects to `/login`

---

## Styling Conventions

- Tailwind CSS 3 utility classes throughout
- No `tailwind.config.js` customisation — uses default scale + arbitrary values
- `font-black` for headings/labels, `font-semibold` for body
- `rounded-xl` / `rounded-2xl` for cards, `rounded-lg` for buttons/badges
- Slate palette for neutrals; role-specific accent colors (blue=client, emerald=consultant, purple=both, rose=admin)
- `tabular-nums` class on countdown displays to prevent layout shift
