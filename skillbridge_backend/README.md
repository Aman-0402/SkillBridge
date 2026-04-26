# SkillBridge Backend

Django REST API for SkillBridge Platform

## Setup

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Folder Structure

```
skillbridge_backend/
├── skillbridge/          # Project settings
├── users/               # User authentication & profiles
├── projects/            # Freelancing projects
├── jobs/                # Job postings
├── proposals/           # Bid proposals
├── consultations/       # Consultation bookings
├── core/                # WebSocket & shared utilities
├── manage.py
├── requirements.txt
└── .env
```

## API Endpoints

- `/api/auth/register/` - User registration
- `/api/auth/login/` - User login (JWT)
- `/api/auth/refresh/` - Token refresh
- `/api/auth/profile/` - User profile
