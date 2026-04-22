# MediQueue - Backend Wiki

Sistem backend untuk aplikasi MediQueue (Aplikasi Antrian Pasien & Klinik Pintar). Dibangun menggunakan **Golang** dengan pola *Clean Architecture* untuk memastikan skalabilitas, kemudahan *testing*, dan struktur kode yang rapi.

## 🚀 Teknologi yang Digunakan
*   **Bahasa:** Golang (Go)
*   **Web Framework:** Gin Web Framework
*   **ORM / Database:** GORM dengan PostgreSQL
*   **Autentikasi:** JWT (JSON Web Token) & bcrypt
*   **Konfigurasi:** Godotenv (.env)

---

## 📁 Struktur Folder (Clean Architecture)

Proyek ini mengadaptasi Clean Architecture dengan pembagian layer yang jelas:

```text
backend/
├── cmd/               # Titik masuk (Entry point) aplikasi. Berisi main.go untuk inisialisasi router dan dependencies.
├── infrastructure/    # Konfigurasi infrastruktur eksternal (Database Connection, dll).
├── internal/
│   ├── entity/        # Struktur data inti (Model/Schema). Tidak bergantung pada library luar.
│   ├── repository/    # Layer untuk akses ke database (GORM). Mengimplementasikan interface.
│   ├── usecase/       # Business Logic. Tempat aturan bisnis aplikasi berjalan.
│   ├── handler/       # Controller (Gin). Menerima HTTP Request, validasi, dan memanggil Usecase.
│   ├── middleware/    # Filter HTTP (Auth JWT, Role-based Access, CORS).
├── config/            # Parsing file .env ke dalam struct Golang.
└── scratch/           # Skrip pengujian sementara (bukan untuk production).
```

---

## 🔐 Role & Permissions (Hak Akses)
Aplikasi memiliki 3 jenis peran utama:
1.  **Admin:** Akses penuh ke semua data (Dashboard Admin, Kelola Pasien, Kelola Dokter, Kelola Jadwal, dan Semua Antrian).
2.  **Doctor (Dokter):** Akses spesifik untuk menangani antrian hariannya dan melihat rekam medis pasien yang pernah ditanganinya.
3.  **Patient (Pasien):** Akses personal untuk mendaftar antrian, melihat antrian pribadi, dan melihat riwayat medis pribadi.

---

## 📡 Detail API Endpoints (Berdasarkan Role)

Seluruh respons dari API menggunakan format JSON standar berikut:
```json
{
  "status": 200,
  "message": "Success message",
  "data": { ... },
  "meta": { ... } // Opsional, untuk pagination
}
```

---

### 🟢 1. Public API (Tidak Butuh Token)

#### `POST /api/v1/auth/register`
Mendaftarkan pasien baru.
*   **Request Body:**
    ```json
    {
      "email": "pasien@mail.com",
      "password": "password123",
      "full_name": "Budi Santoso",
      "nik": "3201234567890001",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "address": "Jl. Merdeka No.1"
    }
    ```
*   **Response:** Mengembalikan objek user.

#### `POST /api/v1/auth/login`
Login untuk mendapatkan akses.
*   **Request Body:**
    ```json
    {
      "email": "pasien@mail.com",
      "password": "password123"
    }
    ```
*   **Response:** Mengembalikan `{"token": "ey..."}`.

---

### 🔵 2. Role: Patient (Pasien)
_Header yang dibutuhkan: `Authorization: Bearer <token>`_

#### `POST /api/v1/appointments`
Mendaftar antrian baru.
*   **Request Body:**
    ```json
    {
      "doctor_id": "uuid-dokter",
      "schedule_id": "uuid-jadwal",
      "appointment_date": "2026-04-27"
    }
    ```
*   **Response:** Objek antrian beserta `queue_number`.

#### `GET /api/v1/appointments/my`
Melihat seluruh riwayat antrian pasien.
*   **Query Params:** `?page=1&per_page=10`

#### `GET /api/v1/medical-records/my`
Melihat seluruh rekam medis dan resep obat yang diterima pasien.

#### `GET /api/v1/dashboard/patient`
Mendapatkan statistik dasbor (Jumlah antrian hari ini, antrian menunggu, rekam medis).

#### `PUT /api/v1/auth/profile`
Memperbarui data profil pasien.

---

### 🩺 3. Role: Doctor (Dokter)
_Header yang dibutuhkan: `Authorization: Bearer <token>`_

#### `GET /api/v1/appointments/today`
Melihat daftar antrian pasien untuk dokter tersebut hari ini atau tanggal tertentu.
*   **Query Params:** `?date=2026-04-27` (Opsional)

#### `PATCH /api/v1/appointments/:id/status`
Memperbarui status antrian (contoh: memanggil pasien masuk atau menyelesaikan konsultasi).
*   **Request Body:**
    ```json
    {
      "status": "in_progress" // "in_progress", "completed", atau "waiting"
    }
    ```

#### `POST /api/v1/medical-records`
Mengisi diagnosa rekam medis dan meresepkan obat.
*   **Request Body:**
    ```json
    {
      "appointment_id": "uuid-antrian",
      "patient_id": "uuid-pasien",
      "complaint": "Pusing 3 hari",
      "diagnosis": "Flu",
      "doctor_notes": "Istirahat cukup",
      "icd_code": "J00",
      "prescriptions": [
        {
          "medicine_name": "Paracetamol",
          "dosage": "500mg",
          "quantity": 10,
          "usage_instruction": "3x sehari"
        }
      ]
    }
    ```

#### `GET /api/v1/dashboard/doctor`
Mendapatkan statistik dokter (jumlah pasien hari ini, pasien menunggu).

---

### 🔴 4. Role: Admin
_Header yang dibutuhkan: `Authorization: Bearer <token>`_

#### `GET /api/v1/dashboard/admin`
Statistik penuh untuk klinik (Total pasien, total dokter, total jadwal).

#### `POST /api/v1/doctors` & `PUT /api/v1/doctors/:id` & `DELETE /api/v1/doctors/:id`
Manajemen master data dokter.

#### `POST /api/v1/schedules` & `PUT /api/v1/schedules/:id` & `DELETE /api/v1/schedules/:id`
Manajemen jadwal praktek dokter (hari, jam, kuota maksimal).

#### `GET /api/v1/appointments`
Melihat **seluruh** antrian klinik dari seluruh dokter.

---

### 🟡 5. Shared Roles (Hak Akses Gabungan)
_Header yang dibutuhkan: `Authorization: Bearer <token>`_

#### `GET /api/v1/patients` & `GET /api/v1/patients/:id` (Admin & Doctor)
Melihat data direktori pasien. Dokter membutuhkan ini untuk melihat riwayat pasien.

#### `GET /api/v1/medical-records/patient/:id` (Admin & Doctor)
Melihat riwayat rekam medis dari pasien tertentu.

#### `PATCH /api/v1/schedules/:id/toggle` (Admin & Doctor)
Mengaktifkan atau menonaktifkan jadwal praktek tertentu secara cepat.

#### `PATCH /api/v1/appointments/:id/cancel` (Semua Role Login)
Membatalkan antrian. Pasien bisa membatalkan antriannya sendiri, Admin bisa membatalkan antrian siapapun.

#### `GET /api/v1/doctors` & `GET /api/v1/schedules` (Semua Role Login)
Membaca daftar dokter dan jadwal yang aktif (biasanya digunakan pasien untuk mendaftar).

---

## 🛠 Cara Menjalankan Server Lokal

1.  Pastikan PostgreSQL sudah menyala dan database `mediqueue` sudah terbuat.
2.  Sesuaikan file `.env`:
    ```env
    PORT=8080
    DB_HOST=localhost
    DB_USER=postgres
    DB_PASSWORD=password_anda
    DB_NAME=mediqueue
    DB_PORT=5432
    JWT_SECRET=supersecretkey
    ```
3.  Buka terminal di folder `backend/`.
4.  Jalankan perintah:
    ```bash
    go mod tidy
    go run .\cmd\main.go
    ```
5.  Server akan berjalan di `http://localhost:8080`.
