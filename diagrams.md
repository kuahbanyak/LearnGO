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

    USERS {
        uuid ID PK
        string Email
        string PasswordHash
        string Role
        string FullName
        string Phone
        string NIK
        string Gender
        string Address
        string BloodType
        boolean IsActive
        time CreatedAt
    }
    
    PATIENTS {
        uuid ID PK
        uuid UserID FK
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
