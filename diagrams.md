# MediQueue System Diagrams

This document contains the Entity-Relationship Diagram (ERD) and Data Flow Diagram (DFD) for the MediQueue application.

## 1. Entity-Relationship Diagram (ERD)

The ERD maps out the main entities in the database and how they relate to one another.

```mermaid
erDiagram
    USERS ||--o| PATIENTS : "has"
    USERS ||--o| DOCTORS : "has"
    DOCTORS ||--o{ DOCTOR_SCHEDULES : "has schedules"
    PATIENTS ||--o{ APPOINTMENTS : "books"
    DOCTORS ||--o{ APPOINTMENTS : "assigned to"
    DOCTOR_SCHEDULES ||--o{ APPOINTMENTS : "contains"
    APPOINTMENTS ||--o| MEDICAL_RECORDS : "results in"
    PATIENTS ||--o{ MEDICAL_RECORDS : "owns"
    DOCTORS ||--o{ MEDICAL_RECORDS : "creates"
    MEDICAL_RECORDS ||--o{ PRESCRIPTIONS : "includes"
    APPOINTMENTS ||--o| CHECKIN_TOKENS : "generates"
    APPOINTMENTS ||--o| RATINGS : "receives"
    APPOINTMENTS ||--o| SYMPTOM_SCREENINGS : "has"

    USERS {
        uuid ID PK
        string Email
        string PasswordHash
        string Role
        string Username
        string FullName
        string Phone
        string NIK
        boolean IsActive
        time CreatedAt
    }
    
    PATIENTS {
        uuid ID PK
        uuid UserID FK
        string FullName
        string Phone
        string NIK
        time DateOfBirth
        string Gender
        string Address
        string BloodType
        string Allergies
    }

    DOCTORS {
        uuid ID PK
        uuid UserID FK
        string FullName
        string Phone
        string Specialization
        string SIPNumber
    }

    DOCTOR_SCHEDULES {
        uuid ID PK
        uuid DoctorID FK
        int DayOfWeek
        string StartTime
        string EndTime
        int MaxPatient
        boolean IsActive
    }

    APPOINTMENTS {
        uuid ID PK
        uuid PatientID FK
        uuid DoctorID FK
        uuid ScheduleID FK
        time AppointmentDate
        int QueueNumber
        string Status
        string CancelReason
        time CheckedInAt
        time CompletedAt
    }

    MEDICAL_RECORDS {
        uuid ID PK
        uuid AppointmentID FK
        uuid PatientID FK
        uuid DoctorID FK
        string Complaint
        string Diagnosis
        string ICDCode
        string ActionTaken
        string DoctorNotes
    }

    PRESCRIPTIONS {
        uuid ID PK
        uuid MedicalRecordID FK
        string MedicineName
        string Dosage
        int Quantity
        string UsageInstruction
        string Notes
    }

    CHECKIN_TOKENS {
        uuid ID PK
        uuid AppointmentID FK
        string Token
        time ExpiresAt
        time UsedAt
    }

    RATINGS {
        uuid ID PK
        uuid AppointmentID FK
        uuid PatientID FK
        uuid DoctorID FK
        int Score
        string Comment
    }

    SYMPTOM_SCREENINGS {
        uuid ID PK
        uuid AppointmentID FK
        uuid PatientID FK
        string Symptoms
        string Severity
        string Notes
    }

    RATINGS {
        uuid ID PK
        uuid AppointmentID FK
        uuid PatientID FK
        uuid DoctorID FK
        int Score
        string Comment
    }
```

## 5. Use Case Diagram

This diagram shows the main use cases for each user role in the MediQueue system.

```mermaid
flowchart TD
    subgraph Actors
        Patient((Patient))
        Doctor((Doctor))
        Admin((Admin))
    end

    subgraph Authentication
        UC1[Register Account]
        UC2[Login]
        UC3[Update Profile]
    end

    subgraph Patient_Use_Cases["Patient Use Cases"]
        UC4[Book Appointment]
        UC5[View Queue Status]
        UC6[View Medical History]
        UC7[Cancel Appointment]
        UC8[View QR Code]
        UC9[Rate Doctor]
        UC10[Submit Symptom Screening]
    end

    subgraph Doctor_Use_Cases["Doctor Use Cases"]
        UC11[View Today's Queue]
        UC12[Update Queue Status]
        UC13[Create Medical Record]
        UC14[Add Prescription]
        UC15[View Patient History]
        UC16[View Own Schedules]
    end

    subgraph Admin_Use_Cases["Admin Use Cases"]
        UC17[Manage Users]
        UC18[Manage Doctors]
        UC19[Manage Schedules]
        UC20[View All Appointments]
        UC21[Scan QR Check-in]
        UC22[View Dashboard Analytics]
        UC23[View TV Display]
        UC24[Export Reports]
    end

    Patient --> UC1
    Patient --> UC2
    Patient --> UC3
    Patient --> UC4
    Patient --> UC5
    Patient --> UC6
    Patient --> UC7
    Patient --> UC8
    Patient --> UC9
    Patient --> UC10

    Doctor --> UC2
    Doctor --> UC3
    Doctor --> UC11
    Doctor --> UC12
    Doctor --> UC13
    Doctor --> UC14
    Doctor --> UC15
    Doctor --> UC16

    Admin --> UC2
    Admin --> UC3
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin --> UC20
    Admin --> UC21
    Admin --> UC22
    Admin --> UC23
    Admin --> UC24
```

## 6. System Architecture Diagram

This diagram shows the high-level architecture of the MediQueue system.

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        Mobile[Mobile Browser]
        TV[TV Display]
    end

    subgraph Frontend["Frontend Layer - React + TypeScript"]
        ReactApp[React Application]
        TanStack[TanStack Query]
        Zustand[Zustand Store]
        Axios[Axios HTTP Client]
        WebSocket[WebSocket Client]
    end

    subgraph Backend["Backend Layer - Go + Gin"]
        API[REST API Handlers]
        Middleware[Middleware Layer]
        Usecase[Business Logic]
        Repository[Data Access Layer]
        WSServer[WebSocket Server]
    end

    subgraph Database["Database Layer"]
        PostgreSQL[(PostgreSQL)]
    end

    subgraph External["External Services"]
        QRService[QR Code Generator]
        EmailService[Email Service]
        NotificationService[Push Notifications]
    end

    Browser --> ReactApp
    Mobile --> ReactApp
    TV --> ReactApp

    ReactApp --> TanStack
    ReactApp --> Zustand
    ReactApp --> WebSocket
    TanStack --> Axios

    Axios --> API
    WebSocket --> WSServer

    API --> Middleware
    Middleware --> Usecase
    Usecase --> Repository
    Repository --> PostgreSQL

    WSServer --> Usecase

    Usecase --> QRService
    Usecase --> EmailService
    Usecase --> NotificationService
```

## 7. Sequence Diagram - Appointment Booking

This diagram shows the sequence of interactions during appointment booking.

```mermaid
sequenceDiagram
    participant P as Patient
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    P->>F: Select Doctor
    F->>B: GET /api/v1/doctors
    B->>DB: Query doctors
    DB-->>B: Doctor list
    B-->>F: Doctors response
    F-->>P: Display doctors

    P->>F: Select Schedule
    F->>B: GET /api/v1/schedules?doctor_id=X
    B->>DB: Query schedules
    DB-->>B: Schedule list
    B-->>F: Schedules response
    F-->>P: Display available slots

    P->>F: Confirm Booking
    F->>B: POST /api/v1/appointments
    B->>DB: Check quota
    DB-->>B: Quota available
    B->>DB: Create appointment
    B->>DB: Generate queue number
    B->>DB: Generate QR token
    DB-->>B: Appointment created
    B-->>F: Appointment response
    F-->>P: Show confirmation + QR
```

## 2. Data Flow Diagram (DFD)

### Level 0 Context Diagram
This diagram shows the high-level interactions between external entities (Admin, Doctor, Patient) and the MediQueue system.

```mermaid
flowchart TD
    %% Context Diagram (Level 0 Equivalent)
    Patient((Patient))
    Doctor((Doctor))
    Admin((Admin))
    Sys[MediQueue System]

    Patient -- "Registers,\nBooks Appointment,\nViews Queue & History" --> Sys
    Sys -- "Queue Status,\nMedical Records" --> Patient

    Doctor -- "Updates Queue Status,\nFills Medical Record" --> Sys
    Sys -- "Appointment List,\nPatient Data" --> Doctor

    Admin -- "Manages Users,\nManages Schedules,\nMonitors System" --> Sys
    Sys -- "System Stats,\nClinic Data" --> Admin
```

### Level 1 DFD
This diagram breaks the system down into its core subsystems/processes and shows how data flows between them and the datastores.

```mermaid
flowchart TD
    %% Level 1 DFD
    subgraph External_Entities
        P((Patient))
        D((Doctor))
        A((Admin))
    end

    subgraph System_Processes
        P1((1. Auth & User\nManagement))
        P2((2. Schedule\nManagement))
        P3((3. Appointment &\nQueue Management))
        P4((4. Medical Record\nManagement))
    end

    subgraph Data_Stores
        D1[(DB: Users/Roles)]
        D2[(DB: Doctors/Schedules)]
        D3[(DB: Appointments)]
        D4[(DB: Medical Records)]
    end

    %% Auth & User Management Flow
    P -. "Register/Login\nUpdate Profile" .-> P1
    D -. "Login" .-> P1
    A -. "Login" .-> P1
    A -->|"Manage All Users\n(CRUD)"| P1
    P1 <--> D1

    %% Admin flows
    A -->|"Manage Doctors &\nSchedules"| P2
    P2 <--> D2

    %% Patient Booking Flow
    P -->|"Book Schedule"| P3
    P3 <--> D2
    P3 <-->|"Create & Update\nAppointments"| D3
    P3 -->|"Queue Status"| P
    
    %% Doctor Queue & Medical Record Flow
    D -->|"View/Update Queue"| P3
    P3 -->|"Queue List"| D
    
    D -->|"Submit Diagnosis &\nPrescription"| P4
    P4 <-->|"Store & Retrieve\nRecords"| D4
    P3 -. "Appointment Ref" .-> P4

    %% Patient History Flow
    P -->|"Request History"| P4
    P4 -->|"Medical Records"| P
```

## 3. QR Check-in Flow Diagram

This diagram shows the patient check-in flow using QR codes.

```mermaid
flowchart TD
    subgraph Patient["Patient Side"]
        P1["Patient Books Appointment"]
        P2["View QR Code in My Queue"]
        P3["QR Code Displayed\n(64-char token)"]
    end

    subgraph Admin["Admin/Staff Side"]
        A1["Open Scan Check-in Page"]
        A2["Choose Method:"]
        A3["Camera Scanner"]
        A4["Upload QR Image"]
        A5["Manual Token Entry"]
        A6["Token Extracted"]
    end

    subgraph Backend["Backend Processing"]
        B1["Validate Token"]
        B2["Check Expiration"]
        B3["Check Already Used"]
        B4["Verify Appointment Status"]
        B5["Mark as Checked-in"]
        B6["Broadcast WebSocket Event"]
    end

    subgraph Result["Result"]
        R1["Success:\nQueue Number Displayed"]
        R2["Real-time Queue Update"]
    end

    P1 --> P2
    P2 --> P3
    P3 -->|"Patient shows QR"| A1

    A1 --> A2
    A2 --> A3
    A2 --> A4
    A2 --> A5

    A3 -->|"Scan"| A6
    A4 -->|"Parse Image"| A6
    A5 -->|"Direct Input"| A6

    A6 --> B1
    B1 -->|"Token Found"| B2
    B2 -->|"Not Expired"| B3
    B3 -->|"Not Used"| B4
    B4 -->|"Status: Waiting"| B5
    B5 --> B6

    B6 --> R1
    B6 --> R2

    B1 -->|"Invalid"| E1["Error: Token Not Found"]
    B2 -->|"Expired"| E2["Error: Token Expired"]
    B3 -->|"Already Used"| E3["Error: Already Checked-in"]
    B4 -->|"Wrong Status"| E4["Error: Invalid Appointment Status"]
```

## 4. Appointment Booking Flow (Updated)

This diagram shows the updated booking flow with same-day booking support.

```mermaid
flowchart TD
    subgraph Patient["Patient Actions"]
        PA1["Select Doctor"]
        PA2["View Available Schedules"]
        PA3["Select Schedule Day"]
        PA4["System Calculates Date"]
        PA5["Confirm Booking"]
    end

    subgraph Validation["Backend Validation"]
        V1["Check Schedule Exists"]
        V2["Check Schedule Active"]
        V3["Check Day of Week Match"]
        V4["Check Quota Available"]
        V5["Generate Queue Number"]
    end

    subgraph Result["Result"]
        R1["Appointment Created"]
        R2["QR Token Generated"]
    end

    PA1 --> PA2
    PA2 --> PA3
    PA3 --> PA4
    
    PA4 -->|"Same Day Allowed ✅"| PA5
    PA4 -->|"Past Date Blocked ❌"| E1["Error: Cannot book past date"]

    PA5 --> V1
    V1 --> V2
    V2 --> V3
    V3 --> V4
    V4 --> V5
    V5 --> R1
    R1 --> R2

    V3 -->|"Day Mismatch"| E2["Error: Schedule not available on selected day"]
    V4 -->|"Quota Full"| E3["Error: Schedule quota full"]
```
```
