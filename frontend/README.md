# MediQueue — Frontend Wiki

> React + TypeScript + Vite + TailwindCSS v4 frontend for MediQueue clinic queue system.

---

## 🚀 Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | ~6.0 | Type safety |
| Vite | ^8 | Build tool + dev server |
| TailwindCSS | v4 | Utility-first styling |
| React Router DOM | v7 | Client-side routing |
| TanStack Query | v5 | Server state + caching |
| Zustand | v5 | Global auth state |
| Axios | v1 | HTTP client (with JWT interceptor) |
| Radix UI | Various | Accessible headless components |
| Recharts | v3 | Data charts |
| Lucide React | v1 | Icon library |
| date-fns | v4 | Date utilities |

---

## 📁 Folder Structure

```
frontend/src/
│
├── api/                       ← Axios API functions per domain
│   ├── auth.ts                  login, register, updateProfile
│   ├── appointments.ts          CRUD + status + cancel
│   ├── dashboard.ts             Stats per role
│   ├── doctors.ts               Doctor list + CRUD
│   ├── schedules.ts             Schedule list + CRUD
│   ├── patients.ts              Patient list
│   └── medical-records.ts       Records + prescriptions
│
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx      ← Sidebar + TopBar + Outlet
│   │   └── sidebar.tsx          ← Collapsible sidebar (role-aware nav)
│   ├── shared/
│   │   └── protected-route.tsx  ← RBAC route guard
│   └── ui/                    ← Reusable primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       └── toaster.tsx
│
├── hooks/
│   └── use-toast.ts           ← Toast notification helper
│
├── lib/
│   ├── axios.ts               ← Axios instance + JWT interceptor
│   └── utils.ts               ← cn(), formatDate(), etc.
│
├── pages/
│   ├── auth/
│   │   ├── login.tsx          ← Split-screen login page
│   │   └── register.tsx       ← Patient registration
│   │
│   ├── admin/
│   │   ├── dashboard.tsx      ← Stats + live queue table + quick actions
│   │   ├── doctors.tsx        ← Doctor CRUD table
│   │   ├── schedules.tsx      ← Schedule management
│   │   ├── patients.tsx       ← Patient directory
│   │   ├── appointments.tsx   ← All-clinic appointments view
│   │   ├── users.tsx          ← User account management
│   │   └── tv-display.tsx     ← Full-screen live queue board (no sidebar)
│   │
│   ├── doctor/
│   │   ├── dashboard.tsx      ← Doctor stats + today summary
│   │   ├── queue.tsx          ← Kanban: Waiting | In Progress | Done
│   │   ├── medical-record-form.tsx  ← Diagnosis + prescription form
│   │   └── medical-records.tsx     ← All records by this doctor
│   │
│   └── patient/
│       ├── dashboard.tsx      ← Welcome + stats + recent appointments
│       ├── book-appointment.tsx  ← Book flow: doctor → schedule → date
│       ├── my-queue.tsx       ← Live queue position tracking
│       ├── medical-history.tsx  ← Past visits + prescriptions
│       └── settings.tsx       ← Edit profile
│
├── store/
│   └── auth-store.ts          ← Zustand: user, token, login(), logout()
│
├── types/
│   └── index.ts               ← Shared TypeScript interfaces
│
├── App.tsx                    ← Router + QueryClient + Toaster
├── main.tsx                   ← ReactDOM.createRoot
└── index.css                  ← Design system + CSS tokens + animations
```

---

## 🔐 Authentication Flow

```
User visits /
   │
   ├── Not logged in → /login
   │      │
   │      └── POST /auth/login
   │              ↓ { token, user }
   │              ↓ Zustand.login(user, token)
   │              ↓ Axios interceptor attaches token
   │              └── Navigate to /[role]/dashboard
   │
   └── Logged in → Role redirect
        admin   → /admin/dashboard
        doctor  → /doctor/dashboard
        patient → /patient/dashboard
```

### ProtectedRoute Guard

```tsx
// App.tsx pattern
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route element={<MainLayout />}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
  </Route>
</Route>
```

---

## 🎨 Design System

### Color Tokens (index.css :root)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | `199 89% 48%` | Buttons, active nav, badges |
| `--success` | `152 69% 40%` | Completed status |
| `--warning` | `38 92% 50%` | Waiting status |
| `--destructive` | `0 84.2% 60.2%` | Cancel/error |
| `--sidebar-background` | `220 27% 14%` | Sidebar bg |
| `--radius` | `0.75rem` | Global border radius |

### Utility Classes

| Class | Effect |
|-------|--------|
| `.gradient-primary` | Blue-to-indigo gradient bg |
| `.gradient-success` | Emerald gradient bg |
| `.gradient-warning` | Amber gradient bg |
| `.gradient-danger` | Red gradient bg |
| `.gradient-purple` | Purple gradient bg |
| `.glass` | White 8% + blur-16 backdrop |
| `.glass-card` | White 82% + blur-12 card |
| `.glass-dark` | Dark + blur overlay |
| `.gradient-text` | Animated shimmer text |
| `.card-hover` | Lift + shadow on hover |
| `.skeleton` | Loading shimmer placeholder |
| `.stagger-item` | Fade + slide-up entry |
| `.number-animate` | Bounce-in for stat numbers |
| `.dot-pulse` | Pulsing live status dot |
| `.float-anim` | Gentle floating animation |
| `.glow-primary` | Blue glow box-shadow |
| `.queue-call-anim` | Pulsing ring for active queue |
| `.shake` | Error shake animation |
| `.slide-in-bottom` | Slide up entry for panels |

### Animations Available

- `fadeSlideUp` — main page entry
- `scaleIn` — modal content
- `overlayShow` — modal overlay
- `numberPop` — stats counter reveal
- `shimmer` — gradient text cycling
- `skeleton-loading` — loading placeholder
- `float` — floating decoration
- `shake` — error feedback
- `ticker` — bottom ticker tape
- `queueCall` — pulsing active queue ring
- `bounceIn` — alert/badge pop-in

---

## ⚡ Data Fetching Patterns

### Standard Query
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['resource', param],
  queryFn: () => resourceApi.getAll({ page: 1, per_page: 10 }),
  refetchInterval: 30_000, // optional auto-refresh
})

const items = data?.data?.data ?? []
```

### Standard Mutation
```tsx
const mutation = useMutation({
  mutationFn: (payload: CreateDto) => resourceApi.create(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    toast.success('Berhasil!', 'Data berhasil disimpan.')
  },
  onError: () => {
    toast.error('Gagal', 'Terjadi kesalahan.')
  }
})

// Call it
mutation.mutate({ name: 'New Item' })
```

### refetchInterval Recommendations

| Page | Interval | Reason |
|------|----------|--------|
| TV Display | 5s | Real-time queue board |
| Doctor Queue | 10s | Near-real-time queue management |
| Admin Dashboard | 15–30s | Live stats |
| Patient Dashboard | 30s | Occasional status changes |
| Tables (doctors, patients, etc.) | None | Static data |

---

## 🗂️ State Management

### Zustand Auth Store

```ts
// store/auth-store.ts
interface AuthState {
  user: User | null        // full user object
  token: string | null     // JWT token
  isAuthenticated: boolean // derived
  login(user, token): void  // saves to localStorage
  logout(): void            // clears state + localStorage
}
```

The Axios instance reads the token from `localStorage` on every request:
```ts
// lib/axios.ts
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

## 📄 Pages Summary

### Auth Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Split-screen auth with demo accounts & floating icons |
| Register | `/register` | Patient self-registration form |

### Admin Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin/dashboard` | Stats cards + live queue + quick actions |
| Doctors | `/admin/doctors` | CRUD table: add, edit, delete doctors |
| Schedules | `/admin/schedules` | Practice schedule management |
| Patients | `/admin/patients` | Read-only patient directory |
| Appointments | `/admin/appointments` | All-clinic queue view, filterable |
| Users | `/admin/users` | Activate/deactivate user accounts |
| TV Display | `/admin/tv-display` | Full-screen queue board (no sidebar) |

### Doctor Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/doctor/dashboard` | Stats + today's queue summary |
| Queue | `/doctor/queue` | Kanban board: Waiting / In Progress / Done |
| Medical Records | `/doctor/medical-records` | All records created by this doctor |

### Patient Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/patient/dashboard` | Welcome banner + stats + recent queue |
| Book | `/patient/book` | Step-by-step booking wizard |
| My Queue | `/patient/my-queue` | Live queue position + status |
| Medical History | `/patient/medical-history` | Past visits + prescriptions |
| Settings | `/patient/settings` | Edit profile data |

---

## 🏃 Running the Frontend

```bash
cd frontend/

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173

# Type-check
npx tsc --noEmit

# Build for production
npm run build
```

> **Proxy:** `vite.config.ts` proxies `/api/*` to `http://localhost:8080`. Ensure backend is running first.

---

## ➕ Adding a New Page (Checklist)

- [ ] Create `src/pages/[role]/new-page.tsx`
- [ ] Add API call in `src/api/[resource].ts` if needed
- [ ] Add TypeScript type in `src/types/index.ts` if needed
- [ ] Register route in `App.tsx` under correct `ProtectedRoute` + `MainLayout`
- [ ] Add nav item in `sidebar.tsx` `navItems` array for the correct role
- [ ] Add path label in `main-layout.tsx` `pathLabels` map for breadcrumb
- [ ] Follow the standard page layout pattern (see below)

### Standard Page Template

```tsx
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => myApi.getAll(),
  })
  const items = data?.data?.data ?? []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Page Title
        </h1>
        <p className="text-slate-500 mt-1">Page description</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ... */}
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="font-medium">Tidak ada data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="stagger-item p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-all"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Item content */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 💡 Innovation Integration Guide

### WebSocket (Real-time Queue)
```tsx
// Replace polling with WebSocket in TV display / doctor queue
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/ws/queue')
  ws.onmessage = (e) => {
    queryClient.invalidateQueries({ queryKey: ['tv-queue'] })
  }
  return () => ws.close()
}, [])
```

### Dark Mode Toggle
```tsx
// Add to main-layout.tsx header
const toggleDark = () => {
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
}
// CSS variables for .dark are already defined in index.css ✅
```

### PWA (Installable App)
```bash
npm install -D vite-plugin-pwa
# Add to vite.config.ts → VitePWA({ registerType: 'autoUpdate', ... })
```

---

*MediQueue Frontend Wiki · v1.0 · May 2026*