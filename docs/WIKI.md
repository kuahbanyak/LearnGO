# MediQueue — Dokumentasi Sistem (Wiki)

## Deskripsi Umum

MediQueue adalah sistem antrian klinik pintar berbasis web yang mengelola alur pasien dari pendaftaran hingga konsultasi selesai. Sistem ini dibangun dengan arsitektur modern:

- **Backend**: Go (Gin Framework) + PostgreSQL + GORM + WebSocket
- **Frontend**: React + TypeScript + TanStack Query + Zustand
- **Autentikasi**: JWT (JSON Web Token) dengan role-based access control
- **Real-time**: WebSocket untuk update antrian live

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Admin   │  │  Doctor  │  │ Patient  │  │   Public     │   │
│  │  Pages   │  │  Pages   │  │  Pages   │  │   Pages      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │            │
│  ┌────┴──────────────┴──────────────┴───────────────┴────────┐  │
│  │              API Client (Axios) + TanStack Query           │  │
│  └────────────────────────────┬──────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────┘
                                │ HTTP/WS
┌───────────────────────────────┼──────────────────────────────────┐
│                        BACKEND (Go + Gin)                        │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │                    Handler Layer (REST API)                 │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │                    Usecase Layer (Business Logic)           │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │                    Repository Layer (Data Access)           │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│  ┌────────────────────────────┴──────────────────────────────┐  │
│  │                    PostgreSQL Database                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Role & Hak Akses

| Role    | Deskripsi                                    |
|---------|----------------------------------------------|
| Admin   | Mengelola dokter, jadwal, pasien, pengguna, analitik |
| Doctor  | Mengelola antrian, rekam medis, konsultasi   |
| Patient | Booking antrian, check-in, lihat riwayat medis |

## Fitur Utama

1. **Autentikasi** — Register, Login, JWT, Remember Me
2. **Manajemen Dokter** — CRUD profil dokter (Admin)
3. **Manajemen Jadwal** — Jadwal mingguan per dokter (Admin)
4. **Booking Antrian** — Wizard 3 langkah (Patient)
5. **QR Check-in** — Scan QR code untuk check-in (Public/Admin)
6. **Antrian Live** — Real-time queue position via WebSocket
7. **Konsultasi** — Call next, mark in-progress, complete (Doctor)
8. **Rekam Medis** — Dokumentasi konsultasi + resep (Doctor)
9. **Rating Dokter** — Penilaian 1-5 bintang (Patient)
10. **Symptom Screening** — Pre-screening gejala sebelum konsultasi
11. **Analytics** — Visualisasi data operasional klinik (Admin)
12. **TV Display** — Papan antrian fullscreen untuk ruang tunggu
13. **Export** — PDF/CSV untuk laporan dan rekam medis

---

## Use Case Diagram

```mermaid
graph LR
    subgraph Aktor
        Admin((Admin))
        Doctor((Doctor))
        Patient((Patient))
        Public((Public/Visitor))
    end

    subgraph "Sistem MediQueue"
        %% Auth
        UC_Register[Register]
        UC_Login[Login]
        UC_Logout[Logout]
        UC_UpdateProfile[Update Profile]
        UC_DeleteAccount[Delete Account]

        %% Admin
        UC_ManageDoctors[Kelola Dokter]
        UC_ManageSchedules[Kelola Jadwal]
        UC_ManagePatients[Kelola Pasien]
        UC_ManageUsers[Kelola Pengguna]
        UC_ViewAnalytics[Lihat Analitik]
        UC_AdminDashboard[Dashboard Admin]
        UC_ScanCheckin[Scan QR Check-in]
        UC_ExportData[Export Data]
        UC_ManageAppointments[Kelola Janji Temu]

        %% Doctor
        UC_DoctorDashboard[Dashboard Dokter]
        UC_ManageQueue[Kelola Antrian]
        UC_CallNext[Panggil Berikutnya]
        UC_CompleteConsultation[Selesai Konsultasi]
        UC_CreateMedRecord[Buat Rekam Medis]
        UC_ViewMedRecords[Lihat Rekam Medis]
        UC_MarkNoShow[Tandai Tidak Hadir]

        %% Patient
        UC_PatientDashboard[Dashboard Pasien]
        UC_BookAppointment[Booking Antrian]
        UC_ViewQueue[Lihat Antrian Live]
        UC_ViewHistory[Lihat Riwayat Medis]
        UC_RateDoctor[Beri Rating Dokter]
        UC_SymptomScreening[Isi Screening Gejala]
        UC_Settings[Pengaturan Akun]

        %% Public
        UC_PublicCheckin[Check-in via QR]
        UC_TVDisplay[Papan Antrian TV]
    end

    %% Admin connections
    Admin --> UC_Login
    Admin --> UC_AdminDashboard
    Admin --> UC_ManageDoctors
    Admin --> UC_ManageSchedules
    Admin --> UC_ManagePatients
    Admin --> UC_ManageUsers
    Admin --> UC_ViewAnalytics
    Admin --> UC_ScanCheckin
    Admin --> UC_ExportData
    Admin --> UC_ManageAppointments

    %% Doctor connections
    Doctor --> UC_Login
    Doctor --> UC_DoctorDashboard
    Doctor --> UC_ManageQueue
    Doctor --> UC_CallNext
    Doctor --> UC_CompleteConsultation
    Doctor --> UC_CreateMedRecord
    Doctor --> UC_ViewMedRecords
    Doctor --> UC_MarkNoShow

    %% Patient connections
    Patient --> UC_Register
    Patient --> UC_Login
    Patient --> UC_PatientDashboard
    Patient --> UC_BookAppointment
    Patient --> UC_ViewQueue
    Patient --> UC_ViewHistory
    Patient --> UC_RateDoctor
    Patient --> UC_SymptomScreening
    Patient --> UC_Settings
    Patient --> UC_UpdateProfile
    Patient --> UC_DeleteAccount

    %% Public connections
    Public --> UC_PublicCheckin
    Public --> UC_TVDisplay
    Public --> UC_Register
```

---

## Activity Diagram

### 1. Alur Booking Antrian (Patient)

```mermaid
flowchart TD
    Start([Pasien buka halaman Booking]) --> CheckProfile{Profil lengkap?}
    CheckProfile -->|Tidak| GoSettings[Redirect ke Pengaturan]
    CheckProfile -->|Ya| Step1[Step 1: Pilih Dokter]
    Step1 --> FilterDoc{Filter spesialisasi?}
    FilterDoc -->|Ya| ApplyFilter[Terapkan filter] --> Step1
    FilterDoc -->|Tidak| SelectDoc[Pilih dokter]
    SelectDoc --> Step2[Step 2: Pilih Tanggal & Waktu]
    Step2 --> SelectDate[Pilih tanggal dari kalender 30 hari]
    SelectDate --> ShowSlots[Tampilkan slot tersedia]
    ShowSlots --> SelectSlot[Pilih slot waktu]
    SelectSlot --> Step3[Step 3: Konfirmasi]
    Step3 --> FillSymptom{Isi screening gejala?}
    FillSymptom -->|Ya| SymptomForm[Isi form gejala]
    FillSymptom -->|Lewati| Confirm[Konfirmasi booking]
    SymptomForm --> Confirm
    Confirm --> Submit[Submit ke API]
    Submit --> CheckSlot{Slot masih tersedia?}
    CheckSlot -->|Ya| Success[Booking berhasil → Lihat Antrian]
    CheckSlot -->|Tidak| SlotError[Error: slot penuh]
    SlotError --> RefreshSlots[Refresh jadwal] --> ShowSlots
    Success --> End([Selesai])
```

### 2. Alur Check-in via QR (Public/Admin)

```mermaid
flowchart TD
    Start([Buka halaman Check-in]) --> Mode{Pilih mode}
    Mode -->|QR Scan| RequestCam[Minta izin kamera]
    Mode -->|Manual| ManualInput[Input kode manual]

    RequestCam --> CamOK{Izin diberikan?}
    CamOK -->|Ya| Scanning[Scan QR code]
    CamOK -->|Tidak| FallbackManual[Tampilkan input manual]
    FallbackManual --> ManualInput

    Scanning --> Decoded[Token terbaca]
    Decoded --> SubmitToken[Kirim token ke API]
    ManualInput --> EnterCode[Masukkan kode]
    EnterCode --> SubmitToken

    SubmitToken --> Valid{Token valid?}
    Valid -->|Ya| SymptomStep{Isi screening?}
    Valid -->|Tidak| ShowError[Tampilkan error]
    ShowError --> RetryAction[Coba lagi] --> Mode

    SymptomStep -->|Ya| FillForm[Isi form gejala]
    SymptomStep -->|Lewati| IssueTicket[Terbitkan tiket]
    FillForm --> IssueTicket
    IssueTicket --> ShowTicket[Tampilkan nomor antrian]
    ShowTicket --> End([Selesai])
```

### 3. Alur Konsultasi Dokter

```mermaid
flowchart TD
    Start([Dokter buka halaman Antrian]) --> LoadQueue[Muat antrian hari ini]
    LoadQueue --> Display[Tampilkan 3 lane: Menunggu, Konsultasi, Selesai]

    Display --> Action{Aksi dokter?}
    Action -->|Panggil Berikutnya| CallNext[Pindahkan pertama Menunggu → Konsultasi]
    Action -->|Selesai Konsultasi| PromptRecord{Buat rekam medis?}
    Action -->|Tidak Hadir| MarkNoShow[Tandai no-show]

    CallNext --> OptimisticUI[Update UI optimistik]
    OptimisticUI --> SubmitAPI[Kirim ke API]
    SubmitAPI --> APISuccess{Berhasil?}
    APISuccess -->|Ya| WSBroadcast[WebSocket broadcast update]
    APISuccess -->|Tidak| Revert[Revert UI + tampilkan error]
    Revert --> Display

    MarkNoShow --> OptimisticUI

    PromptRecord -->|Isi| OpenForm[Buka form rekam medis]
    PromptRecord -->|Lewati| SkipRecord[Konfirmasi lewati]
    OpenForm --> SubmitRecord[Simpan rekam medis]
    SubmitRecord --> MoveComplete[Pindahkan ke Selesai]
    SkipRecord --> MoveComplete
    MoveComplete --> OptimisticUI

    WSBroadcast --> Reconcile[Sinkronisasi state]
    Reconcile --> Display
```

### 4. Alur Rating Dokter (Patient)

```mermaid
flowchart TD
    Start([Pasien buka Riwayat Medis]) --> LoadRecords[Muat daftar rekam medis]
    LoadRecords --> ShowList[Tampilkan daftar kronologis]
    ShowList --> SelectRecord[Pilih rekam medis]
    SelectRecord --> CheckRated{Sudah dinilai?}
    CheckRated -->|Ya| ShowBadge[Tampilkan badge 'Sudah Dinilai']
    CheckRated -->|Tidak| ShowRateBtn[Tampilkan tombol Rating]
    ShowRateBtn --> ClickRate[Klik 'Beri Rating']
    ClickRate --> OpenModal[Buka modal rating]
    OpenModal --> SelectStars[Pilih 1-5 bintang]
    SelectStars --> WriteComment{Tulis komentar?}
    WriteComment -->|Ya| FillComment[Isi komentar maks 1000 karakter]
    WriteComment -->|Tidak| SubmitRating[Kirim rating]
    FillComment --> SubmitRating
    SubmitRating --> APICall[POST /ratings]
    APICall --> Success{Berhasil?}
    Success -->|Ya| UpdateUI[Update row → badge 'Sudah Dinilai']
    Success -->|Tidak| ShowError[Tampilkan error]
    UpdateUI --> End([Selesai])
```

---

## Data Flow Diagram

### Alur Data: Booking → Antrian → Konsultasi → Rating

```mermaid
sequenceDiagram
    participant P as Patient
    participant FE as Frontend
    participant API as Backend API
    participant DB as PostgreSQL
    participant WS as WebSocket

    Note over P,DB: === FASE 1: BOOKING ===
    P->>FE: Pilih dokter + tanggal + slot
    FE->>API: POST /appointments {doctor_id, schedule_id, date}
    API->>DB: Cek kuota slot (SELECT FOR UPDATE)
    DB-->>API: Kuota tersedia
    API->>DB: INSERT appointment (status=waiting, queue_number=N)
    DB-->>API: OK
    API-->>FE: 201 {appointment, queue_number}
    FE-->>P: Tampilkan nomor antrian

    Note over P,DB: === FASE 2: CHECK-IN ===
    P->>FE: Scan QR / input kode
    FE->>API: PATCH /check-in/:token
    API->>DB: Validasi token (not expired, not used)
    API->>DB: Mark token used, update checked_in_at
    DB-->>API: OK
    API->>WS: Broadcast {type: "checkin", data: {...}}
    API-->>FE: 200 {appointment, queue_number}

    Note over P,DB: === FASE 3: KONSULTASI ===
    P->>FE: Lihat antrian live (WebSocket)
    WS-->>FE: Push queue_update events
    FE-->>P: Update posisi real-time

    Note over P,DB: === FASE 4: DOKTER PANGGIL ===
    API->>DB: UPDATE status = in_progress
    API->>WS: Broadcast {type: "queue_update"}
    WS-->>FE: Push ke semua subscriber
    FE-->>P: "Anda sedang ditangani"

    Note over P,DB: === FASE 5: REKAM MEDIS ===
    API->>DB: INSERT medical_record + prescriptions
    API->>DB: UPDATE appointment status = completed

    Note over P,DB: === FASE 6: RATING ===
    P->>FE: Beri rating 1-5 + komentar
    FE->>API: POST /ratings {appointment_id, score, comment}
    API->>DB: Validasi (completed, belum rated, milik pasien)
    API->>DB: INSERT rating
    DB-->>API: OK
    API-->>FE: 201 {rating}
```

---

## Class Diagram (Entity Relationship)

```mermaid
classDiagram
    class Role {
        +UUID id
        +String role_name
        +Time created_at
        +Time updated_at
    }

    class User {
        +UUID id
        +String username
        +String email
        +String password_hash
        +UUID role_id
        +Bool is_active
        +Time created_at
        +Time updated_at
        +GetRoleName() String
        +IsAdmin() Bool
        +IsDoctor() Bool
        +IsPatient() Bool
    }

    class Patient {
        +UUID id
        +UUID user_id
        +String full_name
        +String phone
        +String nik
        +Time date_of_birth
        +String gender
        +String address
        +String blood_type
        +String allergies
        +Time created_at
    }

    class Doctor {
        +UUID id
        +UUID user_id
        +String full_name
        +String phone
        +String specialization
        +String sip_number
        +Time created_at
    }

    class DoctorSchedule {
        +UUID id
        +UUID doctor_id
        +Int day_of_week
        +String start_time
        +String end_time
        +Int max_patient
        +Bool is_active
        +DayName(int) String
    }

    class Appointment {
        +UUID id
        +UUID patient_id
        +UUID doctor_id
        +UUID schedule_id
        +Time appointment_date
        +Int queue_number
        +String status
        +String cancel_reason
        +Time checked_in_at
        +Time completed_at
    }

    class MedicalRecord {
        +UUID id
        +UUID appointment_id
        +UUID patient_id
        +UUID doctor_id
        +String complaint
        +String diagnosis
        +String icd_code
        +String action_taken
        +String doctor_notes
        +Time created_at
    }

    class Prescription {
        +UUID id
        +UUID medical_record_id
        +String medicine_name
        +String dosage
        +Int quantity
        +String usage_instruction
        +String notes
    }

    class Rating {
        +UUID id
        +UUID appointment_id
        +UUID patient_id
        +UUID doctor_id
        +Int score
        +String comment
        +Time created_at
    }

    class CheckInToken {
        +UUID id
        +UUID appointment_id
        +String token
        +Time expires_at
        +Time used_at
    }

    class SymptomScreening {
        +UUID id
        +UUID appointment_id
        +UUID patient_id
        +String symptoms
        +String severity
        +String additional_notes
        +String duration
        +String temperature
        +String ai_summary
    }

    %% Relationships
    Role "1" --> "*" User : has many
    User "1" --> "0..1" Patient : has one
    User "1" --> "0..1" Doctor : has one
    Doctor "1" --> "*" DoctorSchedule : has many
    Patient "1" --> "*" Appointment : has many
    Doctor "1" --> "*" Appointment : has many
    DoctorSchedule "1" --> "*" Appointment : has many
    Appointment "1" --> "0..1" MedicalRecord : has one
    MedicalRecord "1" --> "*" Prescription : has many
    Appointment "1" --> "0..1" Rating : has one
    Appointment "1" --> "0..1" CheckInToken : has one
    Appointment "1" --> "0..1" SymptomScreening : has one
    Patient "1" --> "*" Rating : has many
    Doctor "1" --> "*" Rating : has many
```

---

## API Endpoints

### Autentikasi (Public)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /auth/register | Registrasi pasien baru |
| POST | /auth/login | Login (semua role) |
| GET | /auth/me | Profil user saat ini |
| PUT | /auth/profile | Update profil |
| DELETE | /auth/me | Hapus akun |

### Admin Only
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /doctors | Tambah dokter |
| PUT | /doctors/:id | Edit dokter |
| DELETE | /doctors/:id | Hapus dokter |
| POST | /schedules | Tambah jadwal |
| PUT | /schedules/:id | Edit jadwal |
| DELETE | /schedules/:id | Hapus jadwal |
| GET | /appointments | Semua janji temu |
| GET | /dashboard/admin | Statistik admin |
| GET/PUT/DELETE | /users/:id | Kelola pengguna |
| GET | /analytics | Data analitik |
| GET | /export/appointments | Export PDF |

### Doctor Only
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /appointments/today | Antrian hari ini |
| PATCH | /appointments/:id/status | Update status antrian |
| POST | /medical-records | Buat rekam medis |
| GET | /medical-records/patient/:id | Rekam medis per pasien |
| GET | /dashboard/doctor | Statistik dokter |

### Patient Only
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /appointments | Booking antrian |
| GET | /appointments/my | Antrian saya |
| PUT | /patients/profile | Update profil pasien |
| GET | /dashboard/patient | Statistik pasien |
| GET | /medical-records/my | Rekam medis saya |
| POST | /ratings | Beri rating dokter |

### Shared (Authenticated)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /doctors | Daftar dokter |
| GET | /schedules/doctor/:id | Jadwal per dokter |
| GET | /appointments/:id | Detail janji temu |
| PATCH | /appointments/:id/cancel | Batalkan janji |
| PATCH | /appointments/:id/reschedule | Jadwalkan ulang |
| GET | /ratings/doctor/:id/summary | Ringkasan rating |
| POST | /symptom-screenings | Isi screening gejala |
| WS | /ws | WebSocket real-time |

### Public (No Auth)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| PATCH | /check-in/:token | Check-in via QR token |

---

## Status Appointment

```
waiting → in_progress → completed
    ↓           ↓
cancelled   cancelled
```

| Status | Deskripsi |
|--------|-----------|
| waiting | Pasien terdaftar, menunggu dipanggil |
| in_progress | Pasien sedang dalam konsultasi |
| completed | Konsultasi selesai |
| cancelled | Dibatalkan oleh pasien/admin |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript 5.7, Vite 5, TailwindCSS v4 |
| State Management | Zustand v5 (auth, theme), TanStack Query v5 (server state) |
| UI Components | Radix UI v1-v2, Lucide Icons v1, Recharts v3 |
| Backend | Go 1.25.4, Gin Framework v1.9+ |
| Database | PostgreSQL 14+ |
| ORM | GORM v2 |
| Auth | JWT (HS256) - golang-jwt/jwt v5 |
| Real-time | WebSocket (gorilla/websocket) |
| QR Code | skip2/go-qrcode, html5-qrcode v2.3.8 |
| PDF Export | jung-kurt/gofpdf |
| Containerization | Docker, Docker Compose |
