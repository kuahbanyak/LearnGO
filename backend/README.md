# MediQueue — Backend Wiki

> Sistem backend untuk MediQueue (Aplikasi Antrian Pasien & Klinik Pintar).  
> Dibangun menggunakan **Golang** dengan pola **Clean Architecture**.

---

## 🚀 Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | Go 1.21+ | Compiled, typed, concurrent |
| HTTP Framework | Gin | High-performance router |
| ORM | GORM v2 | Code-first schema with AutoMigrate |
| Database | PostgreSQL 14+ | UUID primary keys |
| Auth | JWT (golang-jwt v5) + bcrypt | Stateless auth |
| Config | godotenv | 12-factor config via `.env` |
| Containerization | Docker + Docker Compose | Prod-ready compose file included |

---

## 📁 Folder Structure (Clean Architecture)

```
backend/
├── cmd/
│   └── main.go              ← Entry point: wire deps, start Gin router
├── config/
│   └── config.go            ← Parse .env → Config struct
├── infrastructure/
│   └── database.go          ← PostgreSQL GORM connection + AutoMigrate
├── internal/
│   ├── entity/              ← Domain models (pure structs, no framework deps)
│   │   ├── user.go
│   │   ├── patient.go
│   │   ├── doctor.go
│   │   ├── doctor_schedule.go
│   │   ├── appointment.go
│   │   ├── medical_record.go
│   │   └── prescription.go
│   ├── dto/                 ← Request/Response shapes (separate from entities)
│   ├── repository/          ← GORM queries implementing domain interfaces
│   ├── usecase/             ← Pure business logic, calls repository interfaces
│   ├── handler/             ← Gin controllers: parse HTTP, validate, call usecase
│   └── middleware/          ← JWT auth, RBAC role guard, CORS headers
├── pkg/
│   └── response/            ← Standard JSON response helpers
└── docker-compose.yml       ← Postgres + App container stack
```

### Layer Dependency Rule

```
Handler → Usecase → Repository → Database
  ↑ (no cross-layer imports allowed in opposite direction)
```

---

## 🗄️ Database Schema

### ERD Overview

```
users ──────────── patients ──── appointments ──── medical_records ──── prescriptions
     └──────────── doctors ─┤        ↑
                             └── doctor_schedules
```

### Table Definitions

| Table | Key Columns |
|-------|-------------|
| `users` | `id UUID PK`, `email`, `password_hash`, `role` (admin/doctor/patient), `full_name`, `nik`, `is_active` |
| `patients` | `id UUID PK`, `user_id FK`, `date_of_birth`, `blood_type`, `allergies` |
| `doctors` | `id UUID PK`, `user_id FK`, `specialization`, `sip_number` |
| `doctor_schedules` | `id UUID PK`, `doctor_id FK`, `day_of_week` (0–6), `start_time`, `end_time`, `max_patient`, `is_active` |
| `appointments` | `id UUID PK`, `patient_id FK`, `doctor_id FK`, `schedule_id FK`, `appointment_date`, `queue_number`, `status`, `cancel_reason`, `checked_in_at`, `completed_at` |
| `medical_records` | `id UUID PK`, `appointment_id FK`, `patient_id FK`, `doctor_id FK`, `complaint`, `diagnosis`, `icd_code`, `action_taken`, `doctor_notes` |
| `prescriptions` | `id UUID PK`, `medical_record_id FK`, `medicine_name`, `dosage`, `quantity`, `usage_instruction`, `notes` |

### Appointment Status Flow

```
POST /appointments → [waiting]
                          │
PATCH status in_progress ─┤→ [in_progress]
                          │
PATCH status completed ───┤→ [completed]
                          │
PATCH /cancel ────────────┴→ [cancelled]
```

---

## 🔐 Role & Permissions

The system has 3 roles. The JWT payload contains `role` and `user_id`.

| Role | Access Level |
|------|-------------|
| `admin` | Full access to all resources; can create doctors, schedules; sees all queues |
| `doctor` | Own queue only; can create medical records; can view any patient profile |
| `patient` | Own appointments, own medical records, own profile only |

### Middleware Chain

```
AllRoutes → CORS middleware
AuthRequired routes → JWT middleware → extract user_id + role
Role-locked routes → RBAC middleware → check role in allowed list
```

---

## 📡 API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Standard Response Envelope
```json
{
  "status": 200,
  "message": "Success",
  "data": { },
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — correct JWT but wrong role |
| 404 | Not Found |
| 409 | Conflict — duplicate (e.g. same schedule slot) |
| 422 | Unprocessable — business rule violation |
| 500 | Internal Server Error |

---

### 🟢 Public Endpoints (No Token)

#### `POST /auth/register`
Register a new patient account.
```json
// Request
{
  "email": "pasien@mail.com",
  "password": "Min8Chars!",
  "full_name": "Budi Santoso",
  "nik": "3201234567890001",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "address": "Jl. Merdeka No.1"
}
// Response: user object
```

#### `POST /auth/login`
```json
// Request
{ "email": "user@mail.com", "password": "password" }
// Response
{ "token": "eyJhbGci..." , "user": { "id": "...", "role": "patient", ... } }
```

---

### 🔵 Patient Endpoints

> Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/patient` | Stats: waiting, today_queue, completed_today |
| `POST` | `/appointments` | Book new appointment |
| `GET` | `/appointments/my` | My appointment history (paginated) |
| `PATCH` | `/appointments/:id/cancel` | Cancel own appointment |
| `GET` | `/medical-records/my` | My full medical records + prescriptions |
| `PUT` | `/auth/profile` | Update own profile |
| `GET` | `/doctors` | List available doctors |
| `GET` | `/schedules` | List active schedules |

---

### 🩺 Doctor Endpoints

> Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/doctor` | Stats: today patients, waiting |
| `GET` | `/appointments/today?date=YYYY-MM-DD` | Today's queue list |
| `PATCH` | `/appointments/:id/status` | Update queue status |
| `POST` | `/medical-records` | Create diagnosis + prescriptions |
| `GET` | `/medical-records` | All records created by this doctor |
| `GET` | `/patients` | Patient directory |
| `GET` | `/patients/:id` | Single patient profile |
| `GET` | `/medical-records/patient/:id` | Patient's medical history |
| `PATCH` | `/schedules/:id/toggle` | Toggle schedule active status |

---

### 🔴 Admin Endpoints

> Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/admin` | Full clinic stats |
| `GET` | `/appointments` | All appointments (filterable by date) |
| `POST` | `/doctors` | Create doctor account |
| `PUT` | `/doctors/:id` | Update doctor |
| `DELETE` | `/doctors/:id` | Delete doctor |
| `POST` | `/schedules` | Create practice schedule |
| `PUT` | `/schedules/:id` | Update schedule |
| `DELETE` | `/schedules/:id` | Delete schedule |
| `GET` | `/users` | All user accounts |
| `PATCH` | `/users/:id/toggle` | Activate/deactivate user |

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | ✅ | HTTP server port | `8080` |
| `DB_HOST` | ✅ | PostgreSQL hostname | `localhost` |
| `DB_PORT` | ✅ | PostgreSQL port | `5432` |
| `DB_USER` | ✅ | DB username | `postgres` |
| `DB_PASSWORD` | ✅ | DB password | `secret123` |
| `DB_NAME` | ✅ | Database name | `mediqueue` |
| `JWT_SECRET` | ✅ | HMAC signing key (keep secret!) | `supersecretkey` |

---

## 🏃 Running the Backend

### Option A — Docker (Recommended)
```bash
cd backend/
docker-compose up -d
```

### Option B — Native Go
```bash
# Prerequisites: PostgreSQL running, .env configured
cd backend/
cp .env.example .env
# Edit .env with your values

go mod tidy
go run ./cmd/main.go
# → Server at http://localhost:8080
```

---

## 🧩 Adding a New Feature (Checklist)

- [ ] Add entity struct in `internal/entity/`
- [ ] Define DTO request/response in `internal/dto/`
- [ ] Write repository interface + GORM implementation in `internal/repository/`
- [ ] Implement business logic in `internal/usecase/`
- [ ] Write Gin handler in `internal/handler/`
- [ ] Register route in `cmd/main.go` with correct middleware
- [ ] Add entity to `AutoMigrate` list in `infrastructure/database.go`
- [ ] Write a test in the corresponding `_test.go` file

---

## 📈 Innovation Roadmap

| Priority | Feature | Backend Task |
|----------|---------|--------------|
| 🔴 High | **WebSocket Live Queue** | Add `gorilla/websocket`; broadcast on status change |
| 🔴 High | **WhatsApp Notification** | Trigger via `go-whatsapp` on `in_progress` |
| 🔴 High | **QR Code Check-in** | `skip2/go-qrcode` on appointment creation |
| 🟡 Medium | **Analytics API** | `GET /analytics` for peak hours, cancellation rate |
| 🟡 Medium | **PDF Export** | `jung-kurt/gofpdf` for daily queue report |
| 🟢 Quick | **Appointment Reschedule** | `PATCH /appointments/:id/reschedule` |
| 🟢 Quick | **Email Reminder** | `robfig/cron` + SMTP cron job |
| 🟢 Quick | **Search & Filter** | Add `?search=&status=&date=` to list endpoints |

---

*MediQueue Backend Wiki · v1.0 · May 2026*
