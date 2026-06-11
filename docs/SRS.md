# Software Requirements Specification (SRS)
## MediQueue - Clinic Queue Management System

> **Document Type:** Software Requirements Specification  
> **Methodology:** Waterfall Model  
> **Version:** 1.0  
> **Date:** May 25, 2026  
> **Status:** Approved

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-25 | Development Team | Initial SRS document |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Requirement Analysis](#3-requirement-analysis)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Design](#6-system-design)
7. [Data Flow Analysis](#7-data-flow-analysis)
8. [Business Process](#8-business-process)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete description of the MediQueue Clinic Queue Management System. It describes the functional and non-functional requirements, system design, data flow, and business processes following the Waterfall Software Development Life Cycle (SDLC) methodology.

### 1.2 Scope

**Product Name:** MediQueue

**Product Description:** A web-based clinic queue management system that streamlines patient appointment booking, check-in, queue monitoring, and medical record management.

**Key Features:**
- Patient self-registration and appointment booking
- QR code-based check-in system
- Real-time queue monitoring via WebSocket
- Doctor consultation workflow management
- Electronic medical records with prescriptions
- Doctor rating and feedback system
- Administrative dashboard with analytics
- Multi-role access control (Admin, Doctor, Patient)

**Target Users:**
- Patients seeking medical consultation
- Doctors managing daily consultations
- Clinic administrators managing operations

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| SRS | Software Requirements Specification |
| SDLC | Software Development Life Cycle |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| QR | Quick Response (code) |
| ERD | Entity-Relationship Diagram |
| DFD | Data Flow Diagram |
| ICD | International Classification of Diseases |
| SIP | Surat Izin Praktik (Doctor's Practice License) |
| NIK | Nomor Induk Kependudukan (National ID Number) |
| WebSocket | Full-duplex communication protocol |
| GORM | Go Object-Relational Mapping |

### 1.4 References

- **Business Process Documentation:** `docs/BUSINESS_PROCESSES.md`
- **System Diagrams:** `diagrams.md`
- **Technical Wiki (Indonesian):** `docs/WIKI.md`
- **Innovation Proposals:** `mediqueue_innovation_wiki.md`

### 1.5 Overview

This document is organized following the Waterfall SDLC phases:
1. **Requirement Analysis** - Stakeholder needs and system requirements
2. **System Design** - Architecture, database, and interface design
3. **Implementation** - Technology stack and development approach
4. **Testing** - Quality assurance strategy
5. **Deployment** - Production deployment plan
6. **Maintenance** - Support and enhancement procedures

---

## 2. Overall Description

### 2.1 Product Perspective

MediQueue is a standalone web application designed to replace manual queue management systems in clinics. The system consists of:

- **Frontend Application** (React 19 + TypeScript)
  - Responsive web interface
  - Real-time updates via WebSocket
  - Role-based dashboards
  - Mobile-friendly design

- **Backend API** (Go 1.25.4 + Gin Framework)
  - RESTful API architecture
  - JWT-based authentication
  - WebSocket server for real-time updates
  - Clean Architecture pattern

- **Database** (PostgreSQL 14+)
  - Relational data storage
  - ACID compliance
  - Full-text search capabilities

- **External Services**
  - QR code generation (skip2/go-qrcode)
  - PDF export (jung-kurt/gofpdf)
  - Email notifications (optional)

### 2.2 Product Functions

**For Patients:**
- Self-registration and profile management
- Browse doctors by specialization
- Book appointments with preferred doctors
- Receive QR code for check-in
- Monitor queue position in real-time
- View medical history and prescriptions
- Rate doctors after consultation

**For Doctors:**
- View daily appointment queue
- Manage queue status (call next, in progress, complete)
- Create medical records with diagnoses
- Add prescriptions with dosage instructions
- View patient medical history
- Access consultation statistics

**For Administrators:**
- Manage doctor profiles and credentials
- Create and manage doctor schedules
- Monitor all appointments across clinic
- Scan QR codes for patient check-in
- View analytics and operational reports
- Export data to PDF/CSV
- Manage user accounts

### 2.3 User Classes and Characteristics

| User Class | Technical Expertise | Frequency of Use | Key Needs |
|------------|-------------------|------------------|-----------|
| **Patient** | Low to Medium | Occasional (when sick) | Easy booking, clear queue status, medical history access |
| **Doctor** | Medium | Daily (work hours) | Efficient queue management, quick medical record entry, patient history |
| **Admin** | Medium to High | Daily (full time) | Complete system control, analytics, user management |

### 2.4 Operating Environment

**Client-Side Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection (minimum 1 Mbps)
- Screen resolution: 1024x768 or higher
- JavaScript enabled
- Camera access (for QR scanning)

**Server-Side Requirements:**
- Operating System: Linux (Ubuntu 20.04+) or Windows Server 2019+
- Go Runtime: 1.25.4 or higher
- PostgreSQL: 14.0 or higher
- Memory: Minimum 2GB RAM (4GB recommended)
- Storage: Minimum 20GB (SSD recommended)
- Network: Static IP address, HTTPS support

### 2.5 Design and Implementation Constraints

**Technical Constraints:**
- Must use Go for backend (team expertise)
- Must use React for frontend (team expertise)
- Must use PostgreSQL (existing infrastructure)
- Must support WebSocket for real-time updates
- Must be deployable via Docker

**Regulatory Constraints:**
- Must comply with medical data privacy regulations
- Must maintain audit trail for medical records
- Must implement secure authentication (JWT)
- Must encrypt sensitive data in transit (HTTPS)

**Business Constraints:**
- Development timeline: 3 months
- Budget: Limited (open-source technologies preferred)
- Team size: 3-5 developers
- Must be maintainable by small team

### 2.6 Assumptions and Dependencies

**Assumptions:**
- Clinic has stable internet connection
- Patients have smartphones or access to computers
- Doctors are comfortable with digital systems
- Clinic staff can operate QR scanners

**Dependencies:**
- PostgreSQL database availability
- Third-party libraries (Gin, GORM, React, etc.)
- QR code generation library
- PDF generation library
- WebSocket support in browsers

---

## 3. Requirement Analysis

### 3.1 Stakeholder Analysis

#### 3.1.1 Primary Stakeholders

**Patients**
- **Needs:** Easy appointment booking, minimal waiting time, clear communication
- **Pain Points:** Long queues, unclear wait times, lost medical records
- **Goals:** Quick access to healthcare, transparent queue status, digital medical history

**Doctors**
- **Needs:** Efficient patient flow, quick access to patient history, easy documentation
- **Pain Points:** Manual queue management, paper-based records, time-consuming documentation
- **Goals:** More time for patient care, organized workflow, digital record keeping

**Clinic Administrators**
- **Needs:** Operational oversight, resource optimization, data-driven decisions
- **Pain Points:** Manual scheduling, no analytics, difficult reporting
- **Goals:** Streamlined operations, better resource utilization, actionable insights

#### 3.1.2 Secondary Stakeholders

**Clinic Owners**
- **Needs:** Return on investment, patient satisfaction, operational efficiency
- **Goals:** Increased patient throughput, reduced operational costs, competitive advantage

**IT Support Staff**
- **Needs:** Maintainable system, clear documentation, monitoring tools
- **Goals:** Easy deployment, minimal downtime, quick troubleshooting

### 3.2 Problem Statement

**Current Situation:**
Clinics rely on manual queue management systems where:
- Patients must physically wait in crowded waiting rooms
- Queue status is unclear, causing anxiety and frustration
- Paper-based medical records are difficult to manage and retrieve
- Doctors spend excessive time on administrative tasks
- No data analytics for operational improvement

**Desired Situation:**
A digital system where:
- Patients can book appointments remotely and monitor queue status
- Check-in is automated via QR codes
- Queue updates are real-time and transparent
- Medical records are digital, searchable, and secure
- Doctors focus on patient care, not paperwork
- Administrators have data-driven insights

**Impact of Problem:**
- Patient dissatisfaction and long wait times
- Inefficient doctor utilization
- Lost or misplaced medical records
- Difficulty in operational planning
- Competitive disadvantage

### 3.3 Requirements Gathering Methods

**Techniques Used:**
1. **Stakeholder Interviews** - Conducted with clinic staff, doctors, and patients
2. **Observation** - Observed current queue management process at 3 clinics
3. **Document Analysis** - Reviewed existing paper-based forms and records
4. **Competitor Analysis** - Analyzed 5 existing queue management systems
5. **Surveys** - Collected feedback from 50+ patients and 10+ doctors

**Key Findings:**
- 85% of patients prefer online booking over phone calls
- 92% of doctors want digital medical records
- Average wait time: 45 minutes (target: <30 minutes)
- 30% of appointments result in no-shows
- Doctors spend 40% of time on paperwork (target: <20%)

### 3.4 Requirements Prioritization

Requirements are prioritized using MoSCoW method:

| Priority | Description | Criteria |
|----------|-------------|----------|
| **Must Have** | Critical for system launch | System cannot function without it |
| **Should Have** | Important but not critical | Significant value, can be deferred if needed |
| **Could Have** | Desirable features | Nice to have, low impact if excluded |
| **Won't Have** | Out of scope for v1.0 | Deferred to future releases |

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization (FR-AUTH)

#### FR-AUTH-01: User Registration (Must Have)
**Description:** System shall allow new patients to register accounts.

**Inputs:**
- Email address (unique, valid format)
- Username (unique, 3-20 characters)
- Password (minimum 8 characters)
- Full name
- Phone number

**Processing:**
- Validate email format and uniqueness
- Validate username uniqueness
- Hash password using bcrypt
- Create User record with role="patient"
- Generate JWT token

**Outputs:**
- User account created
- JWT token returned
- Success confirmation

**Business Rules:**
- BR-AUTH-01: Email must be unique across all users
- BR-AUTH-02: Password must be minimum 8 characters
- BR-AUTH-03: Default role is "patient" for self-registration

#### FR-AUTH-02: User Login (Must Have)
**Description:** System shall authenticate users and provide access tokens.

**Inputs:**
- Username or email
- Password

**Processing:**
- Lookup user by username/email
- Verify password hash
- Check user is_active status
- Generate JWT token (24-hour expiry)

**Outputs:**
- JWT token
- User profile data
- Role information

**Business Rules:**
- BR-AUTH-04: Failed login attempts limited to 5 per 15 minutes
- BR-AUTH-05: Inactive users cannot login
- BR-AUTH-06: JWT tokens expire after 24 hours

#### FR-AUTH-03: Role-Based Access Control (Must Have)
**Description:** System shall enforce role-based permissions on all endpoints.

**Roles:**
- **Admin**: Full system access
- **Doctor**: Queue management, medical records
- **Patient**: Booking, queue monitoring, medical history

**Processing:**
- Middleware validates JWT token
- Extract user role from token
- Check endpoint permission requirements
- Allow or deny access

**Business Rules:**
- BR-AUTH-07: All protected endpoints require valid JWT
- BR-AUTH-08: Role permissions enforced at API level
- BR-AUTH-09: Unauthorized access returns 403 Forbidden

#### FR-AUTH-04: Profile Management (Should Have)
**Description:** Users shall be able to update their profile information.

**Inputs:**
- Full name, phone, address (for patients)
- Specialization, SIP number (for doctors)

**Processing:**
- Validate input data
- Update User and related profile (Patient/Doctor)
- Return updated profile

**Outputs:**
- Updated profile data
- Success confirmation

---

### 4.2 Appointment Management (FR-APPT)

#### FR-APPT-01: Browse Doctors (Must Have)
**Description:** System shall display list of available doctors with their information.

**Inputs:**
- Optional: specialization filter

**Processing:**
- Query active doctors
- Include: name, specialization, average rating, photo
- Apply filters if provided
- Order by name or rating

**Outputs:**
- List of doctors with details
- Schedule availability count

**Business Rules:**
- BR-APPT-01: Only show active doctors
- BR-APPT-02: Display average rating if ratings exist

#### FR-APPT-02: View Doctor Schedules (Must Have)
**Description:** System shall display doctor's available schedules.

**Inputs:**
- Doctor ID

**Processing:**
- Query active schedules for doctor
- Calculate next available dates (30-day window)
- Show current bookings vs max capacity
- Display day of week, time slot, quota

**Outputs:**
- List of schedules with availability
- Next available date for each schedule

**Business Rules:**
- BR-APPT-03: Only show active schedules
- BR-APPT-04: Calculate availability based on existing bookings

#### FR-APPT-03: Book Appointment (Must Have)
**Description:** Patients shall be able to book appointments with doctors.

**Inputs:**
- Doctor ID
- Schedule ID
- Appointment date
- Optional: symptom screening data

**Processing:**
- Validate patient profile is complete
- Validate date matches schedule's day_of_week
- Check quota not exceeded
- Generate queue number (sequential per doctor per day)
- Create Appointment record (status="waiting")
- Generate CheckInToken (64-char random, expires in 24h)
- Generate QR code image

**Outputs:**
- Appointment created
- Queue number assigned
- QR code for check-in
- Confirmation details

**Business Rules:**
- BR-APPT-05: Cannot book past dates
- BR-APPT-06: Same-day booking allowed if before schedule end time
- BR-APPT-07: Queue number resets daily per doctor
- BR-APPT-08: Maximum bookings = schedule.max_patient
- BR-APPT-09: QR token expires 24 hours after appointment date

#### FR-APPT-04: Cancel Appointment (Should Have)
**Description:** Patients and admins shall be able to cancel appointments.

**Inputs:**
- Appointment ID
- Cancel reason (optional)

**Processing:**
- Validate appointment belongs to patient (or user is admin)
- Validate appointment status is "waiting"
- Update status to "cancelled"
- Record cancel_reason
- Free up quota slot

**Outputs:**
- Appointment cancelled
- Quota updated
- Confirmation message

**Business Rules:**
- BR-APPT-10: Can only cancel "waiting" appointments
- BR-APPT-11: Patients can only cancel own appointments
- BR-APPT-12: Admins can cancel any appointment

#### FR-APPT-05: View My Appointments (Must Have)
**Description:** Patients shall view their appointment history and status.

**Inputs:**
- Patient ID (from JWT)

**Processing:**
- Query appointments for patient
- Include: doctor info, schedule, status, queue number
- Order by appointment_date DESC
- Separate active vs historical

**Outputs:**
- List of appointments with details
- QR code for active appointments
- Status indicators

**Business Rules:**
- BR-APPT-13: Only show patient's own appointments
- BR-APPT-14: Display QR code only for "waiting" status

---

### 4.3 Queue Management (FR-QUEUE)

#### FR-QUEUE-01: View Today's Queue (Must Have)
**Description:** Doctors shall view their daily appointment queue.

**Inputs:**
- Doctor ID (from JWT)
- Date (default: today)

**Processing:**
- Query appointments for doctor and date
- Filter by status: waiting, in_progress, completed
- Order by queue_number ASC
- Group by status for Kanban display

**Outputs:**
- Three columns: Waiting, In Progress, Completed
- Patient cards with: name, queue number, check-in time

**Business Rules:**
- BR-QUEUE-01: Only show doctor's own appointments
- BR-QUEUE-02: Only show today's appointments
- BR-QUEUE-03: Order by queue_number (FIFO)

#### FR-QUEUE-02: Call Next Patient (Must Have)
**Description:** Doctor shall call the next patient in queue.

**Inputs:**
- Appointment ID (first in waiting queue)

**Processing:**
- Validate no other patient is "in_progress"
- Update status: waiting → in_progress
- Set timestamp
- Broadcast WebSocket event

**Outputs:**
- Appointment status updated
- Real-time notification to patient
- UI updated across all clients

**Business Rules:**
- BR-QUEUE-04: Only one patient "in_progress" per doctor
- BR-QUEUE-05: Must call patients in queue_number order
- BR-QUEUE-06: WebSocket broadcast to all subscribers

#### FR-QUEUE-03: Complete Consultation (Must Have)
**Description:** Doctor shall mark consultation as complete.

**Inputs:**
- Appointment ID

**Processing:**
- Validate appointment is "in_progress"
- Prompt: "Create medical record?"
- Update status: in_progress → completed
- Set completed_at timestamp
- Broadcast WebSocket event

**Outputs:**
- Appointment completed
- Optional: redirect to medical record form
- Real-time notification to patient

**Business Rules:**
- BR-QUEUE-07: Can only complete "in_progress" appointments
- BR-QUEUE-08: Completed appointments are immutable
- BR-QUEUE-09: Medical record creation is optional but recommended

#### FR-QUEUE-04: Real-time Queue Updates (Must Have)
**Description:** System shall broadcast queue changes in real-time via WebSocket.

**Inputs:**
- Queue status change events

**Processing:**
- WebSocket server maintains client connections
- On status change: broadcast to all subscribers
- Clients update UI without page refresh

**Outputs:**
- Real-time UI updates
- Notification to affected patients
- TV display updates

**Business Rules:**
- BR-QUEUE-10: WebSocket reconnects automatically on disconnect
- BR-QUEUE-11: All queue changes broadcast immediately
- BR-QUEUE-12: Optimistic UI updates with rollback on error

---

### 4.4 Check-in Management (FR-CHECKIN)

#### FR-CHECKIN-01: Generate QR Check-in Token (Must Have)
**Description:** System shall generate unique QR codes for each appointment.

**Inputs:**
- Appointment ID

**Processing:**
- Generate 64-character random token
- Set expiration: appointment_date + 24 hours
- Create CheckInToken record
- Generate QR code image using skip2/go-qrcode
- Encode URL: https://mediqueue.app/check-in/{token}

**Outputs:**
- QR code PNG image
- Token stored in database
- QR code displayed to patient

**Business Rules:**
- BR-CHECKIN-01: Token is 64 alphanumeric characters
- BR-CHECKIN-02: Token expires 24 hours after appointment date
- BR-CHECKIN-03: One token per appointment
- BR-CHECKIN-04: QR code regenerable if lost

#### FR-CHECKIN-02: Scan QR Code (Must Have)
**Description:** Admin/staff shall scan patient QR codes for check-in.

**Inputs:**
- QR code (via camera, file upload, or manual entry)

**Processing:**
- Extract token from QR code
- Validate token exists in database
- Check token not expired
- Check token not already used
- Verify appointment status = "waiting"
- Mark token as used (used_at = now)
- Update appointment.checked_in_at = now
- Broadcast WebSocket event

**Outputs:**
- Check-in confirmation
- Queue number displayed
- Doctor name and estimated wait time
- Real-time notification to patient

**Business Rules:**
- BR-CHECKIN-05: Token can only be used once
- BR-CHECKIN-06: Only "waiting" appointments can be checked in
- BR-CHECKIN-07: Three input methods: camera, file upload, manual
- BR-CHECKIN-08: Check-in updates broadcast via WebSocket

#### FR-CHECKIN-03: Public Check-in Page (Could Have)
**Description:** Patients shall be able to check in via public kiosk without login.

**Inputs:**
- QR code or token

**Processing:**
- Same validation as FR-CHECKIN-02
- No authentication required
- Display confirmation with queue number

**Outputs:**
- Check-in confirmation
- Queue number and doctor name

**Business Rules:**
- BR-CHECKIN-09: No login required for public check-in
- BR-CHECKIN-10: Same validation rules apply

---

### 4.5 Medical Records Management (FR-MED)

#### FR-MED-01: Create Medical Record (Must Have)
**Description:** Doctors shall create medical records after consultation.

**Inputs:**
- Appointment ID
- Complaint (chief complaint)
- Diagnosis
- ICD-10 code
- Action taken (optional)
- Doctor notes (optional)
- Prescriptions array (medicine, dosage, quantity, instructions)

**Processing:**
- Validate appointment status = "in_progress" or "completed"
- Validate doctor is assigned to appointment
- Validate no existing medical record for appointment
- Validate ICD-10 code format
- Create MedicalRecord
- Create Prescription records
- Update appointment status to "completed"
- Generate PDF report

**Outputs:**
- Medical record created
- Prescriptions saved
- Appointment completed
- PDF report available

**Business Rules:**
- BR-MED-01: One medical record per appointment maximum
- BR-MED-02: Only assigned doctor can create record
- BR-MED-03: Medical records are immutable after creation
- BR-MED-04: ICD-10 code required
- BR-MED-05: At least complaint and diagnosis required
- BR-MED-06: Creating record automatically completes appointment

#### FR-MED-02: View Medical Records (Must Have)
**Description:** Patients and doctors shall view medical records.

**Inputs:**
- User role and ID

**Processing:**
- **For Patients**: Query records where patient_id = user
- **For Doctors**: Query records where doctor_id = user
- **For Admins**: Query all records
- Include: appointment, patient, doctor, prescriptions
- Order by created_at DESC

**Outputs:**
- List of medical records
- Detailed view with all information
- PDF download option

**Business Rules:**
- BR-MED-07: Patients see only their own records
- BR-MED-08: Doctors see only records they created
- BR-MED-09: Admins see all records
- BR-MED-10: Records are read-only (cannot be edited)

#### FR-MED-03: Export Medical Record PDF (Should Have)
**Description:** System shall generate PDF reports for medical records.

**Inputs:**
- Medical record ID

**Processing:**
- Retrieve medical record with all related data
- Generate PDF using jung-kurt/gofpdf
- Include: patient info, doctor info, diagnosis, prescriptions
- Format with proper headers, tables, and styling

**Outputs:**
- PDF file download
- Filename: medical_record_{id}_{date}.pdf

**Business Rules:**
- BR-MED-11: PDF includes all record details
- BR-MED-12: PDF generated on-demand (not stored)
- BR-MED-13: PDF includes clinic branding

#### FR-MED-04: Add Prescriptions (Must Have)
**Description:** Doctors shall add multiple prescriptions to medical records.

**Inputs:**
- Medical record ID
- For each prescription:
  - Medicine name
  - Dosage (e.g., "500mg")
  - Quantity (integer)
  - Usage instruction (e.g., "3x daily after meals")
  - Notes (optional)

**Processing:**
- Validate medical record exists
- Validate doctor owns the record
- Create Prescription records
- Link to medical record

**Outputs:**
- Prescriptions saved
- Displayed in medical record

**Business Rules:**
- BR-MED-14: Multiple prescriptions allowed per record
- BR-MED-15: All fields except notes are required
- BR-MED-16: Prescriptions are immutable after creation

---

### 4.6 Administration (FR-ADMIN)

#### FR-ADMIN-01: Manage Doctors (Must Have)
**Description:** Admins shall create, update, and manage doctor profiles.

**Inputs:**
- For create: email, username, password, full_name, phone, specialization, sip_number
- For update: full_name, phone, specialization, sip_number

**Processing:**
- Validate admin role
- Validate email and SIP number uniqueness
- Create User with role="doctor"
- Create Doctor profile
- For updates: modify Doctor record only

**Outputs:**
- Doctor profile created/updated
- Confirmation message

**Business Rules:**
- BR-ADMIN-01: Only admins can manage doctors
- BR-ADMIN-02: SIP number must be unique
- BR-ADMIN-03: Cannot modify user credentials after creation
- BR-ADMIN-04: Can activate/deactivate doctors

#### FR-ADMIN-02: Manage Schedules (Must Have)
**Description:** Admins shall create and manage doctor schedules.

**Inputs:**
- Doctor ID
- Day of week (1-7, Monday-Sunday)
- Start time (HH:MM)
- End time (HH:MM)
- Max patients (integer)

**Processing:**
- Validate admin role
- Validate doctor exists and is active
- Validate start_time < end_time
- Check no overlapping schedules for same doctor
- Create DoctorSchedule with is_active=true

**Outputs:**
- Schedule created/updated
- Available for booking

**Business Rules:**
- BR-ADMIN-05: One doctor can have multiple schedules
- BR-ADMIN-06: Schedules cannot overlap for same doctor
- BR-ADMIN-07: Day of week: 1=Monday, 7=Sunday
- BR-ADMIN-08: Max patients must be positive integer

#### FR-ADMIN-03: Manage Users (Should Have)
**Description:** Admins shall manage all user accounts.

**Inputs:**
- User ID
- Actions: activate, deactivate, reset password, delete

**Processing:**
- Validate admin role
- For activate/deactivate: toggle is_active flag
- For reset password: generate temporary password
- For delete: check dependencies, soft delete preferred

**Outputs:**
- User status updated
- Confirmation message
- Temporary password (if reset)

**Business Rules:**
- BR-ADMIN-09: Cannot delete users with historical data
- BR-ADMIN-10: Deactivating user invalidates sessions
- BR-ADMIN-11: Admin cannot deactivate themselves
- BR-ADMIN-12: Soft delete preferred over hard delete

#### FR-ADMIN-04: View Analytics (Should Have)
**Description:** Admins shall view operational analytics and reports.

**Inputs:**
- Date range filter
- Optional: doctor filter, status filter

**Processing:**
- Calculate metrics:
  - Total appointments (by status)
  - Completion rate
  - Average wait time
  - Doctor performance
  - Peak hours
  - Patient statistics
- Generate charts using Recharts

**Outputs:**
- Dashboard with KPIs
- Interactive charts
- Trend analysis

**Business Rules:**
- BR-ADMIN-13: Only admins can view analytics
- BR-ADMIN-14: Data refreshes every 5 minutes
- BR-ADMIN-15: Date range limited to 12 months

#### FR-ADMIN-05: Export Data (Should Have)
**Description:** Admins shall export data to PDF or CSV.

**Inputs:**
- Data type (appointments, medical records, doctors, patients)
- Format (PDF or CSV)
- Date range and filters

**Processing:**
- Query database with filters
- Format data according to selected format
- Generate file with timestamp in filename

**Outputs:**
- PDF or CSV file download
- Filename: {type}_{date}_{timestamp}.{ext}

**Business Rules:**
- BR-ADMIN-16: Only admins can export data
- BR-ADMIN-17: Large exports show progress indicator
- BR-ADMIN-18: Files generated on-demand (not stored)
- BR-ADMIN-19: Export logs recorded for audit

#### FR-ADMIN-06: TV Display Mode (Could Have)
**Description:** System shall provide full-screen queue display for waiting room.

**Inputs:**
- None (public access)

**Processing:**
- Display all today's appointments
- Group by doctor
- Show queue number, status, estimated time
- Auto-refresh every 5 seconds
- Color-coded by status

**Outputs:**
- Full-screen queue board
- Real-time updates
- Ticker tape with announcements

**Business Rules:**
- BR-ADMIN-20: No authentication required
- BR-ADMIN-21: Auto-refresh every 5 seconds
- BR-ADMIN-22: Shows all doctors' queues

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements (NFR-PERF)

#### NFR-PERF-01: Response Time (Must Have)
**Requirement:** API endpoints shall respond within acceptable time limits.

**Metrics:**
- Simple queries (GET single record): < 200ms
- List queries (GET with pagination): < 500ms
- Complex queries (analytics, reports): < 2 seconds
- File generation (PDF, CSV): < 5 seconds

**Measurement:** 95th percentile response time under normal load

#### NFR-PERF-02: Concurrent Users (Must Have)
**Requirement:** System shall support multiple concurrent users.

**Metrics:**
- Minimum: 50 concurrent users
- Target: 100 concurrent users
- Peak: 200 concurrent users (during busy hours)

**Measurement:** Load testing with simulated users

#### NFR-PERF-03: Database Performance (Must Have)
**Requirement:** Database queries shall be optimized for performance.

**Implementation:**
- Indexes on foreign keys and frequently queried fields
- Query optimization using GORM
- Connection pooling (max 25 connections)
- Query timeout: 30 seconds

#### NFR-PERF-04: WebSocket Performance (Must Have)
**Requirement:** Real-time updates shall be delivered with minimal latency.

**Metrics:**
- WebSocket message delivery: < 100ms
- Maximum concurrent WebSocket connections: 500
- Automatic reconnection on disconnect

---

### 5.2 Security Requirements (NFR-SEC)

#### NFR-SEC-01: Authentication (Must Have)
**Requirement:** System shall implement secure authentication.

**Implementation:**
- JWT tokens with HS256 algorithm
- Password hashing using bcrypt (cost factor 10)
- Token expiration: 24 hours
- Secure token storage (httpOnly cookies or localStorage)

#### NFR-SEC-02: Authorization (Must Have)
**Requirement:** System shall enforce role-based access control.

**Implementation:**
- Middleware validates JWT on all protected endpoints
- Role permissions checked before processing requests
- Unauthorized access returns 403 Forbidden
- Audit log for admin actions

#### NFR-SEC-03: Data Encryption (Must Have)
**Requirement:** Sensitive data shall be encrypted in transit.

**Implementation:**
- HTTPS/TLS 1.2+ for all communications
- SSL certificate from trusted CA
- Redirect HTTP to HTTPS
- Secure WebSocket (WSS)

#### NFR-SEC-04: Input Validation (Must Have)
**Requirement:** All user inputs shall be validated and sanitized.

**Implementation:**
- Server-side validation on all endpoints
- SQL injection prevention (GORM parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection for state-changing operations

#### NFR-SEC-05: Password Policy (Must Have)
**Requirement:** Passwords shall meet minimum security standards.

**Policy:**
- Minimum 8 characters
- No maximum length limit
- No complexity requirements (allow passphrases)
- Rate limiting on login attempts (5 attempts per 15 minutes)

#### NFR-SEC-06: Session Management (Must Have)
**Requirement:** User sessions shall be managed securely.

**Implementation:**
- JWT tokens invalidated on logout
- Sessions terminated on password change
- Inactive session timeout: 24 hours
- No concurrent session limit (allow multiple devices)

---

### 5.3 Reliability Requirements (NFR-REL)

#### NFR-REL-01: Availability (Should Have)
**Requirement:** System shall be available during clinic operating hours.

**Metrics:**
- Target uptime: 99% (during business hours 8 AM - 8 PM)
- Planned maintenance: outside business hours
- Maximum unplanned downtime: 1 hour per month

#### NFR-REL-02: Data Backup (Must Have)
**Requirement:** System data shall be backed up regularly.

**Implementation:**
- Daily automated backups at 2 AM
- Backup retention: 30 days
- Backup verification: weekly
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours

#### NFR-REL-03: Error Handling (Must Have)
**Requirement:** System shall handle errors gracefully.

**Implementation:**
- User-friendly error messages (no stack traces)
- Detailed error logging for debugging
- Automatic retry for transient failures
- Fallback mechanisms for critical features

#### NFR-REL-04: Data Integrity (Must Have)
**Requirement:** System shall maintain data consistency.

**Implementation:**
- Database transactions for multi-step operations
- Foreign key constraints enforced
- Soft delete for critical records
- Audit trail for data modifications

---

### 5.4 Usability Requirements (NFR-USE)

#### NFR-USE-01: User Interface (Must Have)
**Requirement:** Interface shall be intuitive and easy to use.

**Criteria:**
- New users can book appointment without training
- Consistent navigation across all pages
- Clear visual hierarchy and labeling
- Responsive design (mobile, tablet, desktop)

#### NFR-USE-02: Accessibility (Should Have)
**Requirement:** System shall be accessible to users with disabilities.

**Implementation:**
- WCAG 2.1 Level AA compliance (target)
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators on interactive elements

#### NFR-USE-03: Internationalization (Could Have)
**Requirement:** System shall support multiple languages.

**Implementation:**
- Indonesian (primary language)
- English (secondary language)
- Language switcher in UI
- Date/time formatting per locale

#### NFR-USE-04: Help & Documentation (Should Have)
**Requirement:** System shall provide user guidance.

**Implementation:**
- Inline help text for complex forms
- Tooltips for icons and buttons
- FAQ page for common questions
- User manual (PDF) for each role

---

### 5.5 Maintainability Requirements (NFR-MAINT)

#### NFR-MAINT-01: Code Quality (Must Have)
**Requirement:** Code shall be maintainable and well-documented.

**Standards:**
- Clean Architecture pattern (backend)
- Component-based architecture (frontend)
- Code comments for complex logic
- README files for each module
- API documentation (Swagger/OpenAPI)

#### NFR-MAINT-02: Testing (Should Have)
**Requirement:** System shall have automated tests.

**Coverage:**
- Unit tests for business logic (target: 70% coverage)
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Manual testing for UI/UX

#### NFR-MAINT-03: Logging (Must Have)
**Requirement:** System shall log important events.

**Implementation:**
- Structured logging using zap (Go)
- Log levels: DEBUG, INFO, WARN, ERROR
- Log rotation (daily, max 7 days)
- Sensitive data excluded from logs

#### NFR-MAINT-04: Monitoring (Should Have)
**Requirement:** System health shall be monitored.

**Metrics:**
- Server uptime and resource usage
- API response times
- Error rates
- Database connection pool status
- WebSocket connection count

---

### 5.6 Scalability Requirements (NFR-SCALE)

#### NFR-SCALE-01: Horizontal Scaling (Could Have)
**Requirement:** System shall support horizontal scaling.

**Design:**
- Stateless API servers (JWT-based auth)
- Load balancer for multiple instances
- Shared database (PostgreSQL)
- WebSocket sticky sessions

#### NFR-SCALE-02: Database Scaling (Could Have)
**Requirement:** Database shall handle growing data volume.

**Strategy:**
- Indexes on frequently queried fields
- Pagination for large result sets
- Archive old data (>2 years) to separate table
- Read replicas for reporting queries (future)

#### NFR-SCALE-03: Caching (Could Have)
**Requirement:** Frequently accessed data shall be cached.

**Implementation:**
- TanStack Query client-side caching (60s stale time)
- Redis for server-side caching (future)
- Cache invalidation on data updates

---

### 5.7 Compatibility Requirements (NFR-COMPAT)

#### NFR-COMPAT-01: Browser Support (Must Have)
**Requirement:** System shall work on modern browsers.

**Supported Browsers:**
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

**Not Supported:**
- Internet Explorer (any version)
- Browsers with JavaScript disabled

#### NFR-COMPAT-02: Device Support (Must Have)
**Requirement:** System shall work on various devices.

**Supported Devices:**
- Desktop (1920x1080 and above)
- Laptop (1366x768 and above)
- Tablet (768x1024 and above)
- Mobile (375x667 and above)

#### NFR-COMPAT-03: Operating System (Must Have)
**Requirement:** Server shall run on standard operating systems.

**Supported OS:**
- Linux (Ubuntu 20.04+, CentOS 8+)
- Windows Server 2019+
- Docker containers (preferred)

---

## 6. System Design

### 6.1 Architecture Overview

MediQueue follows a **three-tier architecture** with clear separation of concerns:

**Presentation Layer (Frontend)**
- React 19 + TypeScript 5.7
- Vite 5 build tool
- TailwindCSS v4 for styling
- TanStack Query v5 for data fetching
- Zustand v5 for state management

**Application Layer (Backend)**
- Go 1.25.4 with Gin Framework v1.9+
- Clean Architecture pattern (Handler → Usecase → Repository)
- JWT-based authentication
- WebSocket server for real-time updates
- RESTful API design

**Data Layer (Database)**
- PostgreSQL 14+
- GORM v2 ORM
- 10 main entities (users, patients, doctors, appointments, etc.)
- Foreign key constraints enforced
- Indexes on frequently queried fields

### 6.2 Detailed Design Documentation

For comprehensive system design documentation, refer to:

**File:** `diagrams.md`

**Contents:**
1. **Entity-Relationship Diagram (ERD)** - Complete database schema with all 10 entities, attributes, and relationships
2. **Data Flow Diagram (DFD) Level 0** - Context diagram showing external entities and system boundary
3. **Data Flow Diagram (DFD) Level 1** - Main processes: Authentication, Appointment Management, Queue Management, Medical Records
4. **Data Flow Diagram (DFD) Level 2** - Detailed processes:
   - Medical Record Management (create, prescriptions, validate, generate PDF, retrieve)
   - Check-in Process (generate QR, scan, validate, mark checked-in, broadcast)
5. **Use Case Diagram** - All use cases for Patient, Doctor, and Admin actors
6. **System Architecture Diagram** - Frontend, Backend, Database, and External Services layers
7. **Sequence Diagram** - Appointment booking flow with all interactions
8. **QR Check-in Flow Diagram** - Complete check-in workflow from QR generation to validation
9. **Appointment Booking Flow** - Updated flow with same-day booking support
10. **Backend Architecture Class Diagram** - Clean Architecture layers (Handler, Usecase, Repository, Entity, DTO, Middleware, WebSocket)
11. **State Machine Diagram** - Appointment status transitions with all possible states and transitions

### 6.3 Database Design

**Entity Summary:**
- **users** - Base user accounts (email, password, role)
- **patients** - Patient profiles (demographics, medical info)
- **doctors** - Doctor profiles (specialization, credentials)
- **doctor_schedules** - Weekly availability (day, time, capacity)
- **appointments** - Bookings (queue number, status, timestamps)
- **medical_records** - Consultation documentation (diagnosis, ICD code)
- **prescriptions** - Medications (medicine, dosage, instructions)
- **checkin_tokens** - QR codes (token, expiration, usage)
- **ratings** - Doctor feedback (score, comment)
- **symptom_screenings** - Pre-visit symptoms (symptoms, severity)

**Key Relationships:**
- User (1) → Patient (0..1)
- User (1) → Doctor (0..1)
- Doctor (1) → DoctorSchedule (many)
- Patient (1) → Appointment (many)
- Doctor (1) → Appointment (many)
- Appointment (1) → MedicalRecord (0..1)
- MedicalRecord (1) → Prescription (many)
- Appointment (1) → CheckInToken (0..1)
- Appointment (1) → Rating (0..1)

---

## 7. Data Flow Analysis

### 7.1 Data Flow Overview

MediQueue implements a structured data flow following the Waterfall methodology's design phase. All data flows are documented in detail in `diagrams.md`.

### 7.2 Main Data Flows

**1. Patient Registration Flow**
- Input: User credentials + patient demographics
- Processing: Validation → User creation → Patient profile creation
- Output: JWT token + patient account

**2. Appointment Booking Flow**
- Input: Doctor selection + schedule + date
- Processing: Quota check → Queue number generation → QR token creation
- Output: Appointment record + QR code

**3. QR Check-in Flow**
- Input: QR code (scanned/uploaded/manual)
- Processing: Token validation → Expiration check → Usage check → Status update
- Output: Check-in confirmation + WebSocket broadcast

**4. Queue Management Flow**
- Input: Doctor actions (call next, complete, mark no-show)
- Processing: Status validation → State transition → Timestamp update
- Output: Updated appointment + WebSocket broadcast

**5. Medical Record Creation Flow**
- Input: Diagnosis + prescriptions + ICD code
- Processing: Validation → Record creation → Prescription creation → PDF generation
- Output: Medical record + PDF report

**6. Real-time Update Flow**
- Input: Queue status change event
- Processing: WebSocket broadcast to all connected clients
- Output: Real-time UI updates across all devices

### 7.3 Data Flow Diagrams

Comprehensive data flow diagrams are available in `diagrams.md`:

- **DFD Level 0** - System context with external entities (Patient, Doctor, Admin)
- **DFD Level 1** - Main processes with data stores (Users, Appointments, Medical Records)
- **DFD Level 2 - Medical Record Management** - Detailed subprocess flows
- **DFD Level 2 - Check-in Process** - QR code generation and validation flows

---

## 8. Business Process

### 8.1 Business Process Overview

MediQueue implements 15 core business processes across three user roles. All processes are documented in detail following industry-standard business process modeling.

### 8.2 Business Process Documentation

**File:** `docs/BUSINESS_PROCESSES.md`

**Contents:**

**Patient Processes (6 processes):**
- BP-P01: Patient Registration & Onboarding
- BP-P02: Appointment Booking Process (3-step wizard)
- BP-P03: QR Check-in Process (camera/upload/manual)
- BP-P04: Queue Monitoring Process (real-time WebSocket)
- BP-P05: Rating & Feedback Process
- BP-P06: Medical History Viewing

**Doctor Processes (4 processes):**
- BP-D01: Queue Management Process (Kanban board)
- BP-D02: Consultation Process
- BP-D03: Medical Record Creation Process
- BP-D04: Medical Records Management

**Admin Processes (5 processes):**
- BP-A01: Doctor Management Process
- BP-A02: Schedule Management Process
- BP-A03: User Management Process
- BP-A04: Analytics & Reporting Process
- BP-A05: Data Export Process (PDF/CSV)

Each process includes:
- Objective and trigger
- Actors involved
- Detailed process flow
- Business rules (BR-XXX-XX format)
- Outputs and success criteria
- Exception handling

### 8.3 Business Rules

Over 100 business rules are documented across all processes, covering:
- Authentication and authorization
- Appointment management
- Medical records
- Data integrity
- System operations

---

## 9. Appendices

### 9.1 Glossary

| Term | Definition |
|------|------------|
| **Appointment** | A scheduled consultation between patient and doctor |
| **Queue Number** | Sequential number assigned to appointments per doctor per day |
| **Check-in** | Process of confirming patient arrival at clinic |
| **Medical Record** | Documentation of consultation including diagnosis and prescriptions |
| **ICD-10** | International Classification of Diseases, 10th revision |
| **JWT** | JSON Web Token for authentication |
| **WebSocket** | Protocol for real-time bidirectional communication |
| **Clean Architecture** | Software design pattern with layered separation of concerns |
| **RBAC** | Role-Based Access Control |
| **SIP Number** | Surat Izin Praktik (Doctor's Practice License Number) |

### 9.2 References

**External Documentation:**
- [Go Documentation](https://go.dev/doc/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [GORM Documentation](https://gorm.io/docs/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [TanStack Query](https://tanstack.com/query/latest)

**Project Documentation:**
- `diagrams.md` - System diagrams (ERD, DFD, Architecture, State Machine)
- `docs/WIKI.md` - Technical documentation (Indonesian)
- `docs/BUSINESS_PROCESSES.md` - Business process documentation
- `mediqueue_innovation_wiki.md` - Innovation proposals and technical wiki
- `DOCKER_WIKI.md` - Docker setup and deployment
- `REFACTORING_SUMMARY.md` - Recent refactoring work

### 9.3 Waterfall SDLC Phases

This SRS document covers the first two phases of the Waterfall methodology:

**Phase 1: Requirement Analysis** ✅ Complete
- Stakeholder analysis
- Problem statement
- Requirements gathering
- Requirements prioritization

**Phase 2: System Design** ✅ Complete
- Architecture design
- Database design
- Interface design
- Data flow design

**Phase 3: Implementation** 🔄 In Progress
- Backend development (Go + Gin + PostgreSQL)
- Frontend development (React + TypeScript)
- Integration and testing

**Phase 4: Testing** ⏳ Pending
- Unit testing
- Integration testing
- System testing
- User acceptance testing

**Phase 5: Deployment** ⏳ Pending
- Production environment setup
- Database migration
- Application deployment
- User training

**Phase 6: Maintenance** ⏳ Pending
- Bug fixes
- Feature enhancements
- Performance optimization
- Security updates

### 9.4 Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Project Manager** | _______________ | _______________ | __________ |
| **Technical Lead** | _______________ | _______________ | __________ |
| **Business Analyst** | _______________ | _______________ | __________ |
| **Clinic Director** | _______________ | _______________ | __________ |

---

**Document End**

*This Software Requirements Specification (SRS) document is a living document and will be updated as requirements evolve during the development lifecycle.*

**Version History:**
- v1.0 (2026-05-25) - Initial SRS document following Waterfall methodology

