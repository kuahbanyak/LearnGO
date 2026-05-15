# 🏥 MediQueue — Innovation Proposal & Full Wiki

> **Project:** MediQueue | Clinic Queue & Smart Appointment System  
> **Stack:** Go (Gin + GORM + PostgreSQL) · React + TypeScript + Vite + TailwindCSS v4

---

## 📌 Table of Contents
1. [Innovation Ideas](#1-innovation-ideas)
2. [Frontend UI/UX Improvements](#2-frontend-uiux-improvements)
3. [Backend Wiki](#3-backend-wiki)
4. [Frontend Wiki](#4-frontend-wiki)

---

## 1. 💡 Innovation Ideas

These are actionable innovations sorted by **impact vs effort**. All are compatible with the current Go + React stack.

### 🔴 HIGH IMPACT — Recommended to Implement Now

| # | Feature | Why It Matters | Implementation Hint |
|---|---------|----------------|---------------------|
| 1 | **Real-time Queue via WebSocket** | Currently polling every 5–30s. WebSocket makes TV display & patient pages truly live with zero lag | Add `github.com/gorilla/websocket` to Go backend; broadcast events on `status_change` |
| 2 | **WhatsApp / Telegram Notification Bot** | Notify patients when their queue is called — reduces physical waiting room crowding | Use `go-whatsapp` or Telegram Bot API; trigger on `in_progress` status change |
| 3 | **QR Code Check-in** | Patient scans QR to confirm arrival; reduces no-shows and manual admin work | ✅ IMPLEMENTED - Admin can scan/upload patient QR codes via camera, file upload, or manual token entry at `/admin/scan-checkin` |
| 4 | **AI Symptom Pre-screening** | Patient fills a symptom form before arriving; helps doctors prepare faster | Integrate OpenAI API or a local Ollama model; store `preliminary_notes` in `appointments` |
| 5 | **Analytics Dashboard with Charts** | Admin needs trend data: peak hours, busiest doctors, cancellation rate | Use existing `recharts` library; add backend `GET /api/v1/analytics` endpoint |

### 🟡 MEDIUM IMPACT — Next Sprint

| # | Feature | Why It Matters | Implementation Hint |
|---|---------|----------------|---------------------|
| 6 | **Doctor Rating System** | Patients rate their experience (1–5 stars + comment) after visit; builds trust | Add `ratings` table with `appointment_id`, `score`, `comment` |
| 7 | **Dark Mode Toggle** | CSS variables already support dark mode in `index.css` — just needs a toggle button | Add `ThemeProvider` with localStorage persistence; toggle `.dark` class on `<html>` |
| 8 | **Patient Self-Check-in Kiosk** | A dedicated full-screen page (like TV display) where patient types queue number to check in | ✅ IMPLEMENTED - Admin QR scanner page at `/admin/scan-checkin` supports camera, file upload, and manual token |
| 9 | **Multi-Clinic Support** | Allow the system to manage multiple clinic branches | Add `clinic_id` FK to all entities; admin can scope by branch |
| 10 | **Export to PDF/Excel** | Admins need reports: daily queue summary, doctor performance | Use `jung-kurt/gofpdf` or `xuri/excelize` in Go for server-side export |

### 🟢 QUICK WINS — Weekend Projects

| # | Feature | Why It Matters | Implementation Hint |
|---|---------|----------------|---------------------|
| 11 | **Estimated Wait Time Display** | Already computed in `doctor/queue.tsx`; expose it on patient's `my-queue` page | Pass `estimated_time` from the queue API or compute client-side |
| 12 | **Appointment Reschedule** | Currently only cancel is supported; add reschedule flow | Add `PATCH /api/v1/appointments/:id/reschedule` with new `schedule_id` + `date` |
| 13 | **Progressive Web App (PWA)** | Patients can "install" the app and get offline support | Add `vite-plugin-pwa` — 1 config file change |
| 14 | **Search & Filter in Admin Tables** | All admin tables currently lack filtering | Add query params `?search=&status=&date=` to list endpoints |
| 15 | **Email Appointment Reminder** | Send reminder email 1 day before appointment | Add a cron job in Go using `robfig/cron` + SMTP/SendGrid |

---

## 2. 🎨 Frontend UI/UX Improvements

### What Was Changed & Why

#### `index.css` — Enhanced Design System
- Added **CSS custom properties** for richer theming
- Added **glassmorphism** utility classes with better contrast
- Improved **animation library** (bounce-in, float, glow effects)
- Added **dark mode** color tokens (ready to use)
- Added **focus-visible** ring styles for accessibility

#### `sidebar.tsx` — Redesigned Navigation
- Added **notification badge** support per nav item
- Added **tooltip** for collapsed state (shows label on hover)
- Added **role pill** with gradient matching the user's role
- **Active state** now uses left accent bar + full-width highlight

#### `main-layout.tsx` — Premium Top Bar
- **Search bar** now opens an inline input with animation
- **Notification bell** shows count badge
- Added **time display** on the right side
- Added **greeting** that changes by time of day

#### `login.tsx` — Premium Auth Experience  
- Left panel now has **floating animated medical icons**
- Added **trust signals**: "500+ pasien terdaftar", "99.9% uptime"
- Form has **smooth reveal animation** on load
- Error state has **shake animation**

#### TV Display — Cinematic Queue Board
- Numbers now have **large animated countdown** treatment
- Added **ticker tape** at bottom with clinic announcements
- Color-coded by urgency (in_progress = pulsing green border)

---

## 3. 🔧 Backend Wiki

### Architecture Overview

MediQueue backend follows **Clean Architecture** with strict layer separation:

```
Request → Handler → Usecase → Repository → Database
                ↓
           Middleware (Auth JWT, RBAC, CORS)
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Go | 1.21+ |
| HTTP Framework | Gin | v1.9+ |
| ORM | GORM | v2 |
| Database | PostgreSQL | 14+ |
| Auth | JWT (golang-jwt) + bcrypt | v5 |
| Config | godotenv | v1.5 |
| Container | Docker + Docker Compose | - |

### Folder Structure

```
backend/
├── cmd/
│   └── main.go              # Entry point: init DB, wire dependencies, start Gin
├── config/
│   └── config.go            # Parse .env into Config struct
├── infrastructure/
│   └── database.go          # PostgreSQL connection (GORM), AutoMigrate
├── internal/
│   ├── entity/              # Domain models (GORM models, no business logic)
│   │   ├── user.go
│   │   ├── patient.go
│   │   ├── doctor.go
│   │   ├── appointment.go
│   │   └── medical_record.go
│   ├── dto/                 # Data Transfer Objects (request/response shapes)
│   ├── repository/          # DB access layer (GORM queries, implements interfaces)
│   ├── usecase/             # Business logic (calls repository, returns DTOs)
│   ├── handler/             # Gin controllers (parse HTTP, call usecase, return JSON)
│   └── middleware/          # JWT auth, RBAC role guard, CORS
├── pkg/                     # Shared utilities (response helpers, validators)
└── docker-compose.yml       # Postgres + App container config
```

### Database Schema (ERD Summary)

| Table | Key Fields | Relations |
|-------|-----------|-----------|
| `users` | id, email, password_hash, role, full_name, nik | → patients, doctors |
| `patients` | id, user_id, date_of_birth, blood_type, allergies | ← users |
| `doctors` | id, user_id, specialization, sip_number | ← users |
| `doctor_schedules` | id, doctor_id, day_of_week, start_time, end_time, max_patient | ← doctors |
| `appointments` | id, patient_id, doctor_id, schedule_id, queue_number, status | ← patients, doctors, schedules |
| `medical_records` | id, appointment_id, diagnosis, icd_code, prescriptions (array) | ← appointments |

### Role & Permissions Matrix

| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| POST /auth/register | ✅ Public | ✅ Public | ✅ Public |
| POST /auth/login | ✅ Public | ✅ Public | ✅ Public |
| GET /doctors & /schedules | ✅ | ✅ | ✅ |
| POST /appointments | ✅ Own | ❌ | ✅ All |
| GET /appointments/my | ✅ Own | ❌ | ❌ |
| GET /appointments/today | ❌ | ✅ Own | ❌ |
| GET /appointments (all) | ❌ | ❌ | ✅ All |
| PATCH /appointments/:id/status | ❌ | ✅ | ✅ |
| PATCH /appointments/:id/cancel | ✅ Own | ❌ | ✅ All |
| POST /medical-records | ❌ | ✅ | ❌ |
| GET /medical-records/my | ✅ Own | ❌ | ❌ |
| GET /patients | ❌ | ✅ | ✅ |
| POST/PUT/DELETE /doctors | ❌ | ❌ | ✅ |
| POST/PUT/DELETE /schedules | ❌ | ❌ | ✅ |
| GET /dashboard/patient | ✅ | ❌ | ❌ |
| GET /dashboard/doctor | ❌ | ✅ | ❌ |
| GET /dashboard/admin | ❌ | ❌ | ✅ |

### API Response Contract

All endpoints return:
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... },
  "meta": {               // Optional, for paginated responses
    "page": 1,
    "per_page": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

### Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate schedule) |
| 500 | Internal server error |

### Appointment Status Flow

```
[CREATED] → waiting → in_progress → completed
                 ↓
             cancelled
```

### Running Locally

```bash
# 1. Clone and navigate
cd backend/

# 2. Copy env file
cp .env.example .env
# Edit .env: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET

# 3. Run with Docker (recommended)
docker-compose up -d

# 4. OR run natively (requires PostgreSQL running)
go mod tidy
go run ./cmd/main.go

# Server starts at http://localhost:8080
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8080` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | `secret` |
| `DB_NAME` | Database name | `mediqueue` |
| `JWT_SECRET` | JWT signing key (keep secret!) | `sup3rs3cr3t` |

### Adding a New Feature (Backend Checklist)

- [ ] Add entity struct in `internal/entity/`
- [ ] Add DTO in `internal/dto/`
- [ ] Add repository interface + GORM implementation in `internal/repository/`
- [ ] Add usecase with business logic in `internal/usecase/`
- [ ] Add Gin handler in `internal/handler/`
- [ ] Register route in `cmd/main.go` with correct middleware
- [ ] Update `infrastructure/database.go` AutoMigrate list if new table

---

## 4. 🖥️ Frontend Wiki

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React 19 | ^19 |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | ^8 |
| Styling | TailwindCSS | v4 |
| Routing | React Router DOM | v7 |
| Data Fetching | TanStack Query | v5 |
| State (Auth) | Zustand | v5 |
| HTTP Client | Axios | v1 |
| UI Components | Radix UI primitives | v1-v2 |
| Charts | Recharts | v3 |
| Icons | Lucide React | v1 |
| Dates | date-fns | v4 |

### Folder Structure

```
frontend/src/
├── api/                  # Axios API functions (one file per resource)
│   ├── auth.ts           # login, register, updateProfile
│   ├── appointments.ts   # CRUD + status updates
│   ├── dashboard.ts      # Stats per role
│   ├── doctors.ts        # Doctor list + management
│   ├── schedules.ts      # Schedule list + management
│   ├── patients.ts       # Patient list
│   └── medical-records.ts
│
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx   # Sidebar + TopBar + Outlet wrapper
│   │   └── sidebar.tsx       # Collapsible nav sidebar (role-aware)
│   ├── shared/
│   │   └── protected-route.tsx  # Role-based route guard
│   └── ui/               # Reusable primitives (Button, Card, Badge, Dialog, ...)
│
├── hooks/
│   └── use-toast.ts      # Toast notification helper
│
├── lib/
│   ├── axios.ts          # Axios instance with JWT interceptor
│   └── utils.ts          # cn(), formatDate(), etc.
│
├── pages/
│   ├── auth/
│   │   ├── login.tsx     # Split-screen login with demo accounts
│   │   └── register.tsx  # Patient self-registration
│   ├── admin/
│   │   ├── dashboard.tsx       # Stats + live queue + quick actions
│   │   ├── doctors.tsx         # Doctor CRUD table
│   │   ├── schedules.tsx       # Schedule management
│   │   ├── patients.tsx        # Patient directory
│   │   ├── appointments.tsx    # All-clinic queue view
│   │   ├── users.tsx           # User management (activate/deactivate)
│   │   ├── scan-checkin.tsx    # QR scanner for patient check-in (camera/upload/manual)
│   │   └── tv-display.tsx      # Full-screen queue board (no sidebar)
│   ├── doctor/
│   │   ├── dashboard.tsx       # Doctor stats + today summary
│   │   ├── queue.tsx           # Kanban: Waiting | In Progress | Done
│   │   ├── medical-record-form.tsx  # Diagnosis + prescription form
│   │   └── medical-records.tsx # All records created by this doctor
│   └── patient/
│       ├── dashboard.tsx       # Welcome + stats + recent queue
│       ├── book-appointment.tsx # Select doctor → schedule → date → confirm
│       ├── my-queue.tsx        # Current queue status with position
│       ├── medical-history.tsx # All past visits + prescriptions
│       └── settings.tsx        # Update profile info
│
├── store/
│   └── auth-store.ts     # Zustand: user, token, login(), logout()
│
├── types/
│   └── index.ts          # Shared TypeScript interfaces (User, Appointment, etc.)
│
├── App.tsx               # Router + QueryClient + Toaster
├── main.tsx              # React DOM root
└── index.css             # Global CSS + design tokens + animations
```

### Authentication Flow

```
User visits /  →  RootRedirect checks isAuthenticated
  ↓ No               ↓ Yes
/login           → /[role]/dashboard

Login form → POST /auth/login → { token, user }
         → Zustand: login(user, token)
         → Axios interceptor: attach token on all requests
         → Navigate to role dashboard
```

### Design System (index.css)

CSS custom properties defined in `:root`:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | Cyan 500 (`199 89% 48%`) | Buttons, active links, badges |
| `--sidebar-background` | Dark slate (`220 27% 14%`) | Sidebar background |
| `--success` | Emerald | Completed status |
| `--warning` | Amber | Waiting status |
| `--destructive` | Red | Cancel actions |
| `--radius` | `0.75rem` | Border radius base |

**Utility classes available:**
- `.gradient-primary` — blue-to-indigo gradient
- `.gradient-success` — emerald gradient
- `.gradient-warning` — amber gradient
- `.gradient-danger` — red gradient
- `.gradient-purple` — purple gradient
- `.glass` — glassmorphism overlay
- `.glass-card` — frosted white card
- `.gradient-text` — animated shimmer text
- `.card-hover` — lift on hover
- `.skeleton` — animated loading placeholder
- `.stagger-item` — fade-slide-up with animation delay
- `.dot-pulse` — pulsing live indicator dot
- `.number-animate` — bounce-in for stats numbers

### Component Patterns

#### Page Layout Pattern
```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Title</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div className="stagger-item" style={{ animationDelay: `${i * 80}ms` }}>
            <Card className="card-hover border-0 shadow-sm" />
          </div>
        ))}
      </div>

      {/* Content */}
      <Card className="border-0 shadow-sm">...</Card>
    </div>
  )
}
```

#### API Query Pattern (TanStack Query)
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['resource-key', param],
  queryFn: () => resourceApi.getAll({ page, per_page }),
  refetchInterval: 30000, // auto-refresh
})

const mutation = useMutation({
  mutationFn: (payload) => resourceApi.create(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource-key'] })
    toast.success('Created!', 'Resource created successfully')
  },
})
```

#### Role-Based Rendering
```tsx
const { user } = useAuthStore()
if (user?.role === 'admin') return <AdminContent />
if (user?.role === 'doctor') return <DoctorContent />
return <PatientContent />
```

### State Management

Zustand auth store (`store/auth-store.ts`):
```ts
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}
```
- Token is persisted in `localStorage`
- Axios interceptor reads token from store and sets `Authorization: Bearer <token>` header automatically

### Adding a New Page (Frontend Checklist)

- [ ] Create `src/pages/[role]/new-page.tsx`
- [ ] Add API function in `src/api/` if needed
- [ ] Add route in `App.tsx` under the correct `ProtectedRoute` group
- [ ] Add nav item in `sidebar.tsx` under the correct `navItems` array
- [ ] Add breadcrumb label in `main-layout.tsx` `pathLabels`
- [ ] Export types in `src/types/index.ts` if new data shape needed

### Performance Notes

- TanStack Query caches all responses; `staleTime: 60s` by default
- `refetchInterval` is set per-page based on real-time needs (TV: 5s, Dashboard: 30s)
- Skeleton loaders used everywhere — no layout shift during load
- `stagger-item` class staggers list animations via CSS `animation-delay`
- Images/assets in `public/` are served statically by Vite dev server

### Running Locally

```bash
cd frontend/

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build
```

> **Note:** The frontend proxies API calls to `http://localhost:8080` via `vite.config.ts`. Ensure the backend is running first.

---

## 5. 📱 QR Check-in System (Implemented)

### Overview

The QR Check-in system allows clinic staff to quickly check-in patients by scanning their QR codes. This reduces manual data entry and speeds up the check-in process.

### Features

| Feature | Description |
|---------|-------------|
| **Camera Scanner** | Real-time QR code scanning via webcam |
| **File Upload** | Upload QR code image files (PNG, JPG, etc.) |
| **Manual Entry** | Paste token or URL for manual check-in |
| **Success Display** | Shows queue number and doctor info after check-in |

### How It Works

1. Patient books an appointment and receives a QR code (viewable in "My Queue" page)
2. QR code contains a unique 64-character token linked to the appointment
3. At the clinic, admin/staff scans the QR code using `/admin/scan-checkin`
4. System validates the token and marks the patient as checked-in
5. Patient's queue status updates in real-time via WebSocket

### Technical Implementation

**Backend:**
- `internal/entity/checkin_token.go` — CheckInToken model (token, expires_at, used_at)
- `internal/usecase/checkin_usecase.go` — Token generation and validation logic
- `internal/handler/checkin_handler.go` — QR code generation and check-in endpoints
- QR code image generated using `github.com/skip2/go-qrcode`

**Frontend:**
- `src/pages/admin/scan-checkin.tsx` — Admin QR scanner page
- Uses `html5-qrcode` library for camera and file-based scanning
- Three input methods: camera, file upload, manual token

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/appointments/:id/qr` | GET | Get QR code PNG image for appointment |
| `/api/v1/check-in/:token` | PATCH | Validate token and check-in patient |
| `/api/v1/appointments/:id/check-in-status` | GET | Get check-in status for appointment |

### QR Code URL Format

```
https://mediqueue.app/check-in/{64-character-token}
```

The token is extracted from the URL and validated against the database.

### Booking Fix (May 2026)

Fixed an issue where patients couldn't book appointments for the current day:
- **Problem:** Frontend forced same-day bookings to next week
- **Solution:** Removed the `diff === 0 ? 7 : diff` check in `getNextDate()` function
- **File:** `frontend/src/pages/patient/book-appointment.tsx:55-66`

### Schedule Seeder Update

Added Friday to the default doctor schedule:
- **Before:** Monday, Wednesday (`[]int{1, 3}`)
- **After:** Monday, Wednesday, Friday (`[]int{1, 3, 5}`)
- **File:** `backend/infrastructure/database/seeder.go:80-81`

---

*Wiki generated: May 2026 · MediQueue Capstone Project*
