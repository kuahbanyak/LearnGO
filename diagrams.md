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

    %% Auth Flow
    P -. "Register/Login" .-> P1
    D -. "Login" .-> P1
    A -. "Login" .-> P1
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
