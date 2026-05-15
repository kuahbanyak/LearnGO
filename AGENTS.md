# AGENTS.md - MediQueue Development Guide

## Project Overview

MediQueue is a clinic queue management system with real-time WebSocket updates, QR check-in, and medical records.

**Stack:**
- Backend: Go 1.25+ (Gin + GORM + PostgreSQL)
- Frontend: React 19 + TypeScript 6 + Vite 8 + TailwindCSS v4
- Database: PostgreSQL 16
- Containerization: Docker + Docker Compose

---

## Development Commands

### Backend (Go)

```bash
cd backend

# Install dependencies
go mod tidy

# Run development server (port 8080)
go run ./cmd/main.go

# Build binary
go build -o ./bin/mediqueue ./cmd/main.go
```

### Frontend (React/Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run development server (port 5173)
npm run dev

# Type-check + build for production
npm run build

# Preview production build
npm run preview
```

### Docker Development

```bash
# Start full development environment (recommended)
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Reset database (fresh start)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Docker Production

```bash
docker-compose up --build
```

---

## Environment Variables

### Backend (.env in backend/)

```env
APP_PORT=8080
APP_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=Clinic

JWT_SECRET=your-strong-secret-minimum-32-characters
JWT_EXPIRY_HOURS=24

ADMIN_EMAIL=admin@mediqueue.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Super Admin

ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env in frontend/)

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

---

## Architecture

### Backend: Clean Architecture

```
Request → Handler → Usecase → Repository → Database
              ↓
         Middleware (JWT Auth, RBAC, CORS, Rate Limiting)
```

**Layers:**
- `internal/handler/` - HTTP controllers (Gin handlers)
- `internal/usecase/` - Business logic
- `internal/repository/` - Database operations (GORM)
- `internal/entity/` - Domain models
- `internal/dto/` - Request/Response shapes
- `internal/middleware/` - Auth, CORS, rate limiting
- `pkg/` - Shared utilities (logger, response helpers)

### Frontend: React + TanStack Query + Zustand

```
UI Components → TanStack Query (server state) → Axios → Backend API
                    ↓
              Zustand (auth/theme state)
```

**Structure:**
- `src/pages/` - Page components (auth, admin, doctor, patient)
- `src/components/` - Reusable UI components
- `src/api/` - Axios API functions per domain
- `src/store/` - Zustand stores (auth, theme)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities (axios instance, helpers)

---

## Key Ports

| Service | Port |
|---------|------|
| Frontend (dev) | 5173 |
| Backend API | 8080 |
| PostgreSQL | 5432 |

---

## Database

PostgreSQL with GORM auto-migration. Tables:
- `users`, `patients`, `doctors`
- `doctor_schedules`, `appointments`
- `medical_records`, `prescriptions`
- `ratings`, `checkin_tokens`, `symptom_screenings`

**Reset database:**
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

---

## Default Admin Credentials

- Email: `admin@mediqueue.com`
- Password: `Admin@123`

---

## Code Style

- No comments in code (unless explicitly requested)
- TypeScript strict mode enabled
- Backend uses structured logging (zap) - no secrets in logs
- Follow existing patterns in the codebase

---

## Hot Reload

- **Backend**: Air (auto-rebuilds on `.go` file changes in Docker)
- **Frontend**: Vite HMR (instant updates, preserves state)

---

## API Endpoints Summary

### Public
- `POST /api/v1/auth/register` - Register patient
- `POST /api/v1/auth/login` - Login
- `GET /health` - Health check

### Patient (JWT required)
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/my` - My appointments
- `GET /api/v1/medical-records/my` - My medical records

### Doctor (JWT required)
- `GET /api/v1/appointments/today` - Today's queue
- `PATCH /api/v1/appointments/:id/status` - Update status
- `POST /api/v1/medical-records` - Create medical record

### Admin (JWT required)
- `GET /api/v1/analytics` - Analytics data
- `POST /api/v1/doctors` - Create doctor
- `POST /api/v1/schedules` - Create schedule
- `GET /api/v1/appointments/:id/qr` - Get QR code for appointment
- `PATCH /api/v1/check-in/:token` - Check-in patient via QR token

### QR Check-in (NEW)
- **Admin Scanner Page:** `/admin/scan-checkin`
- **Methods:** Camera scan, File upload, Manual token entry
- **Frontend Lib:** `html5-qrcode` npm package

### WebSocket
- `WS /ws` - Real-time queue updates

---

## Documentation

- `DOCKER_WIKI.md` - Docker setup & troubleshooting
- `mediqueue_innovation_wiki.md` - Innovation ideas & full wiki
- `diagrams.md` - ERD, DFD, and QR Check-in flow diagrams
- `REFACTORING_SUMMARY.md` - Recent refactoring details
- `backend/README.md` - Backend architecture
- `frontend/README.md` - Frontend architecture

---

## Recent Updates (May 2026)

### QR Check-in Scanner for Admin
- **Route:** `/admin/scan-checkin`
- **Methods:** Camera scanner, QR image upload, manual token entry
- **Library:** `html5-qrcode` for scanning

### Booking Fix
- Same-day booking now allowed if schedule matches current weekday
- Fixed in `frontend/src/pages/patient/book-appointment.tsx`

### Schedule Seeder
- Added Friday to default schedules: Monday, Wednesday, Friday
- Updated in `backend/infrastructure/database/seeder.go`
