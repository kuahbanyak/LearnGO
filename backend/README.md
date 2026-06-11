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
| WebSocket | gorilla/websocket | Real-time communication |
| PDF Export | gofpdf | Medical record PDF generation |
| QR Code | skip2/go-qrcode | Patient check-in QR codes |
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
│   │   ├── prescription.go
│   │   ├── rating.go              ⭐ NEW
│   │   ├── checkin_token.go       ⭐ NEW
│   │   └── symptom_screening.go   ⭐ NEW
│   ├── dto/                 ← Request/Response shapes (separate from entities)
│   ├── repository/          ← GORM queries implementing domain interfaces
│   ├── usecase/             ← Pure business logic, calls repository interfaces
│   ├── handler/             ← Gin controllers: parse HTTP, validate, call usecase
│   ├── middleware/          ← JWT auth, RBAC role guard, CORS headers
│   └── ws/                  ← WebSocket hub and client         ⭐ NEW
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

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ patients : "has"
    users ||--o{ doctors : "has"
    patients ||--o{ appointments : "books"
    doctors ||--o{ appointments : "accepts"
    doctors ||--o{ doctor_schedules : "creates"
    doctor_schedules ||--o{ appointments : "scheduled_in"
    appointments ||--o| medical_records : "generates"
    medical_records ||--o{ prescriptions : "contains"
    appointments ||--o| ratings : "rated_by"
    appointments ||--o| checkin_tokens : "has"
    appointments ||--o| symptom_screenings : "has"

    users {
        uuid id PK
        string email
        string password_hash
        string role
        string full_name
        string nik
        boolean is_active
    }

    patients {
        uuid id PK
        uuid user_id FK
        date date_of_birth
        string blood_type
        string allergies
    }

    doctors {
        uuid id PK
        uuid user_id FK
        string specialization
        string sip_number
    }

    doctor_schedules {
        uuid id PK
        uuid doctor_id FK
        int day_of_week
        time start_time
        time end_time
        int max_patient
        boolean is_active
    }

    appointments {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        uuid schedule_id FK
        date appointment_date
        int queue_number
        string status
        string cancel_reason
        datetime checked_in_at
        datetime completed_at
    }

    medical_records {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        uuid doctor_id FK
        string complaint
        string diagnosis
        string icd_code
        string action_taken
        string doctor_notes
    }

    prescriptions {
        uuid id PK
        uuid medical_record_id FK
        string medicine_name
        string dosage
        int quantity
        string usage_instruction
        string notes
    }

    ratings {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        uuid doctor_id FK
        int score
        string comment
    }

    checkin_tokens {
        uuid id PK
        uuid appointment_id FK
        string token
        datetime expires_at
        datetime used_at
    }

    symptom_screenings {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        string symptoms
        string severity
        string duration
        string temperature
        string ai_summary
    }
```

---

### ERD Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS                                            │
│  id (PK) | email | password_hash | role | full_name | nik | is_active              │
└───────────────┬─────────────────────────────────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│   PATIENTS    │ │    DOCTORS    │
│ id (PK)       │ │ id (PK)       │
│ user_id (FK)  │ │ user_id (FK)  │
│ date_of_birth │ │ specialization│
│ blood_type    │ │ sip_number    │
│ allergies     │ └───────┬───────┘
└───────┬───────┘         │
        │                 │
        │         ┌───────┴───────┐
        │         │DOCTOR_SCHEDULES│
        │         │ id (PK)        │
        │         │ doctor_id (FK) │
        │         │ day_of_week    │
        │         │ start_time     │
        │         │ end_time       │
        │         │ max_patient    │
        │         │ is_active      │
        │         └───────┬───────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌────────────────────────────────────────────────────────────────┐
        │                      APPOINTMENTS                              │
        │  id (PK) | patient_id (FK) | doctor_id (FK) | schedule_id (FK) │
        │  appointment_date | queue_number | status | cancel_reason      │
        │  checked_in_at | completed_at                                    │
        └───────────────────────────┬────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  MEDICAL_RECORDS  │   │     RATINGS       │   │  CHECKIN_TOKENS   │
│ id (PK)           │   │ id (PK)           │   │ id (PK)           │
│ appointment_id(FK)│   │ appointment_id(FK)│   │ appointment_id(FK)│
│ patient_id (FK)   │   │ patient_id (FK)   │   │ token             │
│ doctor_id (FK)    │   │ doctor_id (FK)    │   │ expires_at        │
│ complaint         │   │ score (1-5)       │   │ used_at           │
│ diagnosis         │   │ comment           │   └───────────────────┘
│ icd_code          │   └───────────────────┘
│ action_taken      │   ┌───────────────────┐
│ doctor_notes      │   │SYMPTOM_SCREENINGS │
└─────────┬─────────┘   │ id (PK)           │
          │             │ appointment_id(FK)│
          ▼             │ patient_id (FK)   │
┌───────────────────┐   │ symptoms          │
│  PRESCRIPTIONS    │   │ severity          │
│ id (PK)           │   │ duration          │
│ medical_record_id │   │ temperature       │
│ medicine_name     │   │ ai_summary        │
│ dosage            │   └───────────────────┘
│ quantity          │
│ usage_instruction │
│ notes             │
└───────────────────┘
```

---

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
| `ratings` | `id UUID PK`, `appointment_id FK`, `patient_id FK`, `doctor_id FK`, `score` (1-5), `comment` |
| `checkin_tokens` | `id UUID PK`, `appointment_id FK`, `token`, `expires_at`, `used_at` |
| `symptom_screenings` | `id UUID PK`, `appointment_id FK`, `patient_id FK`, `symptoms`, `severity`, `duration`, `temperature`, `ai_summary` |

---

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

## 📊 Data Flow Diagram (DFD)

### Level 0 - Context Diagram

```mermaid
flowchart TB
    subgraph External["External Entities"]
        Patient[("👤 Patient")]
        Doctor[("👨‍⚕️ Doctor")]
        Admin[("🔧 Admin")]
    end

    subgraph System["MediQueue System"]
        MediQueue[("🏥 MediQueue\nQueue Management\nSystem")]
    end

    Patient -->|"Register, Login,\nBook Appointment,\nView Queue"| MediQueue
    MediQueue -->|"Queue Status,\nMedical Records,\nNotifications"| Patient

    Doctor -->|"Login, View Queue,\nUpdate Status,\nCreate Records"| MediQueue
    MediQueue -->|"Today's Queue,\nPatient Info"| Doctor

    Admin -->|"Login, Manage Users,\nView Analytics"| MediQueue
    MediQueue -->|"Dashboard Stats,\nReports"| Admin
```

---

### Level 1 - Main Processes

```mermaid
flowchart TB
    subgraph External["External Entities"]
        Patient[("👤 Patient")]
        Doctor[("👨‍⚕️ Doctor")]
        Admin[("🔧 Admin")]
    end

    subgraph Processes["Main Processes"]
        P1["1.0\nAuthentication\nManagement"]
        P2["2.0\nAppointment\nManagement"]
        P3["3.0\nQueue\nManagement"]
        P4["4.0\nMedical Record\nManagement"]
        P5["5.0\nAnalytics &\nReporting"]
        P6["6.0\nReal-time\nNotifications"]
    end

    subgraph DataStore["Data Stores"]
        D1[("D1 Users")]
        D2[("D2 Appointments")]
        D3[("D3 Medical Records")]
        D4[("D4 Ratings")]
        D5[("D5 Check-in Tokens")]
    end

    Patient -->|"Credentials"| P1
    P1 -->|"Auth Token"| Patient
    P1 <-->|"User Data"| D1

    Patient -->|"Book/Cancel"| P2
    Doctor -->|"Update Status"| P2
    P2 <-->|"Appointment Data"| D2

    Patient -->|"View Queue"| P3
    Doctor -->|"Call Patient"| P3
    P3 <-->|"Queue Status"| D2

    Doctor -->|"Create Record"| P4
    Patient -->|"View Records"| P4
    P4 <-->|"Medical Data"| D3

    Admin -->|"Request Stats"| P5
    P5 <-->|"Aggregate Data"| D1
    P5 <-->|"Aggregate Data"| D2
    P5 <-->|"Aggregate Data"| D4

    P3 -->|"Queue Updates"| P6
    P6 -->|"WebSocket Events"| Patient
    P6 -->|"WebSocket Events"| Doctor
```

---

### Level 2 - Appointment Management Detail

```mermaid
flowchart TB
    subgraph Input["Input"]
        Patient[("👤 Patient")]
        Doctor[("👨‍⚕️ Doctor")]
    end

    subgraph P2["2.0 Appointment Management"]
        P2_1["2.1\nValidate\nSchedule"]
        P2_2["2.2\nGenerate\nQueue Number"]
        P2_3["2.3\nCreate\nAppointment"]
        P2_4["2.4\nUpdate\nStatus"]
        P2_5["2.5\nCancel\nAppointment"]
        P2_6["2.6\nReschedule\nAppointment"]
    end

    subgraph DataStore["Data Stores"]
        D_Schedule[("D_Schedules")]
        D_Appt[("D_Appointments")]
        D_Token[("D_Checkin_Tokens")]
    end

    Patient -->|"Select Date/Time"| P2_1
    P2_1 <-->|"Check Availability"| D_Schedule

    P2_1 -->|"Schedule Valid"| P2_2
    P2_2 <-->|"Get Next Number"| D_Appt

    P2_2 -->|"Queue #"| P2_3
    P2_3 -->|"Save"| D_Appt

    Doctor -->|"Update Status"| P2_4
    P2_4 -->|"Update"| D_Appt

    Patient -->|"Cancel Request"| P2_5
    P2_5 -->|"Update Status"| D_Appt

    Patient -->|"Reschedule Request"| P2_6
    P2_6 <-->|"Check New Slot"| D_Schedule
    P2_6 -->|"Update"| D_Appt
```

---

## 🔐 Role & Permissions

The system has 3 roles. The JWT payload contains `role` and `user_id`.

| Role | Access Level |
|------|--------------|
| `admin` | Full CRUD on doctors, schedules, users; view all appointments; analytics dashboard |
| `doctor` | View own appointments; update status; create medical records; view patient history |
| `patient` | Register, book appointments, view own queue, view own medical records, rate doctors |

---

## 🌐 API Endpoints

### 🔓 Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register new patient |
| `POST` | `/auth/login` | Login → JWT |
| `PATCH` | `/check-in/:token` | QR check-in (public) |

---

### 👤 Patient Endpoints

> Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/me` | Current user profile |
| `POST` | `/appointments` | Book new appointment |
| `GET` | `/appointments/my` | My appointments list |
| `GET` | `/appointments/:id` | Appointment detail |
| `GET` | `/appointments/:id/qr` | Get QR code for check-in |
| `PATCH` | `/appointments/:id/cancel` | Cancel own appointment |
| `PATCH` | `/appointments/:id/reschedule` | Reschedule appointment |
| `GET` | `/medical-records/my` | My full medical records + prescriptions |
| `GET` | `/medical-records/:id/pdf` | Download medical record PDF |
| `POST` | `/ratings` | Rate a completed appointment |
| `POST` | `/symptom-screenings` | Submit symptom screening |
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
| `GET` | `/ratings/doctor/:id` | Get doctor's ratings |
| `GET` | `/ratings/doctor/:id/summary` | Rating summary |
| `PATCH` | `/schedules/:id/toggle` | Toggle schedule active status |

---

### 🔴 Admin Endpoints

> Header: `Authorization: Bearer <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/admin` | Full clinic stats |
| `GET` | `/analytics?days=30` | Analytics data for charts |
| `GET` | `/appointments` | All appointments (filterable by date) |
| `GET` | `/export/appointments?format=pdf` | Export appointments to PDF |
| `POST` | `/doctors` | Create doctor account |
| `PUT` | `/doctors/:id` | Update doctor |
| `DELETE` | `/doctors/:id` | Delete doctor |
| `POST` | `/schedules` | Create practice schedule |
| `PUT` | `/schedules/:id` | Update schedule |
| `DELETE` | `/schedules/:id` | Delete schedule |
| `GET` | `/users` | All user accounts |
| `PATCH` | `/users/:id/toggle` | Activate/deactivate user |

---

### 🔌 WebSocket Endpoint

| Path | Description |
|------|-------------|
| `WS /ws` | Real-time queue updates |

**Broadcast Events:**
- `queue_update` - Appointment status changed
- `new_appointment` - New appointment booked
- `checked_in` - Patient checked in via QR

---

## 📱 QR Check-in System

### Overview
The QR Check-in system allows clinic staff to quickly check-in patients by scanning their QR codes.

### Check-in Methods (Frontend)
1. **Camera Scanner** - Real-time QR scanning via webcam
2. **File Upload** - Upload QR code image files (PNG, JPG, etc.)
3. **Manual Entry** - Paste token or URL directly

### Flow
```
Patient Books → Receives QR (64-char token) → 
Admin Scans QR → Token Validated → Patient Checked-in → Queue Updated
```

### Technical Details
- Token: 64-character hex string (32 random bytes)
- Expiration: End of appointment day (23:59:59)
- QR Library: `github.com/skip2/go-qrcode`
- Frontend Scanner: `html5-qrcode` npm package

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | ✅ | HTTP server port | `8080` |
| `DB_HOST` | ✅ | PostgreSQL hostname | `localhost` |
| `DB_PORT` | ✅ | PostgreSQL port | `5432` |
| `DB_USER` | ✅ | Database username | `mediqueue` |
| `DB_PASSWORD` | ✅ | Database password | `secret` |
| `DB_NAME` | ✅ | Database name | `mediqueue` |
| `JWT_SECRET` | ✅ | JWT signing key | `your-secret-key` |
| `JWT_EXPIRY_HOURS` | ⬜ | Token expiry | `24` |
| `APP_ENV` | ⬜ | Environment | `development` |

---

## 🚀 Running the Application

### Using Go directly

```bash
# Install dependencies
go mod tidy

# Run the server
go run ./cmd/main.go
```

### Using Docker Compose

```bash
docker-compose up -d
```

Server starts at `http://localhost:8080`

---

## 📋 Features Implemented

| # | Feature | Status |
|---|---------|--------|
| 1 | Real-time WebSocket Queue | ✅ |
| 2 | QR Code Patient Check-in | ✅ |
| 3 | Doctor Rating System | ✅ |
| 4 | Analytics Dashboard API | ✅ |
| 5 | PDF Export (Appointments & Medical Records) | ✅ |
| 6 | Symptom Pre-screening | ✅ |
| 7 | Appointment Reschedule | ✅ |
| 8 | Search & Filter | ✅ |
| 9 | Admin QR Scanner (Camera/Upload) | ✅ NEW |

---

## 📝 License

MIT License - MediQueue 2026
