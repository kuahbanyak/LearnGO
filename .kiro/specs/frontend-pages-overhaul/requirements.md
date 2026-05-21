# Requirements Document

## Introduction

This document defines the formal requirements for a full frontend overhaul of MediQueue (sistem antrian klinik). The overhaul redesigns every user-facing page across three role groups — Admin, Doctor, Patient — plus public-facing pages (authentication, walk-in check-in, TV display), applying the "soft machine medical" design system already established by the `frontend-design-migration` spec.

The overhaul is **layered on top of** the existing design token system (CSS custom properties), CVA component primitives (Button, Card, StatCard), theme system (light/dark/high-contrast), motion system, and font loading strategy. This spec does not redefine those primitives. Instead, it specifies the page-level functional behavior, information architecture, interaction flows, and non-functional qualities each page must satisfy when re-skinned and re-composed using those primitives.

The overhaul is **non-destructive** with respect to the backend: REST endpoints, request/response shapes, authentication tokens, role-based access control, and WebSocket event contracts remain unchanged. Existing routing structure, Zustand stores, TanStack Query keys, and the axios API client are preserved; only their consuming UI is restyled and reorganized.

System design artifacts — use case diagrams (per role), activity diagrams (per major flow), and data flow diagrams (frontend ↔ state ↔ backend) — are treated as deliverables of the design phase, with this document specifying the underlying functional behaviors those diagrams must capture.

## Glossary

- **MediQueue_Frontend**: The React + TypeScript single-page application that consumes the existing Go REST API and WebSocket service
- **App_Shell**: The persistent layout chrome (sidebar, top bar, role-aware navigation, theme toggle, user menu) that wraps every authenticated page
- **Routing_Layer**: The react-router-dom v7 configuration that maps URL paths to role-gated page components
- **Auth_Store**: The Zustand store that holds the authenticated user, JWT token, role, and persisted session state
- **API_Client**: The axios instance and TanStack Query layer used for all REST calls and cache management
- **Realtime_Sync_Layer**: The WebSocket consumer that pushes queue, appointment, and check-in updates to subscribed pages
- **Design_System**: The token, typography, theme, motion, and component foundation delivered by the `frontend-design-migration` spec
- **Login_Page**: The public sign-in page for staff and patients
- **Register_Page**: The public sign-up page for new patient accounts
- **Public_Checkin_Page**: The unauthenticated walk-in check-in page that accepts a QR token or manual queue code
- **TV_Display_Page**: The full-screen, high-contrast queue board intended for waiting-room monitors
- **Admin_Dashboard**: The landing page for users with the Admin role, summarizing clinic-wide KPIs
- **Admin_Doctors_Page**: The CRUD page for managing doctor profiles, specialties, and active status
- **Admin_Schedules_Page**: The page for managing doctor weekly schedules and time-slot capacity
- **Admin_Patients_Page**: The page for browsing, searching, and editing patient records
- **Admin_Appointments_Page**: The page for monitoring and managing all clinic appointments
- **Admin_Users_Page**: The page for managing staff user accounts, roles, and permissions
- **Admin_Analytics_Page**: The page for visualizing clinic operational metrics (volume, wait times, doctor utilization, satisfaction)
- **Admin_Scan_Checkin_Page**: The admin-operated check-in counter page that scans patient QR tokens via webcam
- **Doctor_Dashboard**: The landing page for users with the Doctor role, summarizing today's queue and personal KPIs
- **Doctor_Queue_Page**: The page for managing the doctor's active queue (call next, mark in-consultation, complete, no-show)
- **Doctor_Medical_Records_Page**: The page for browsing and creating medical records for the doctor's patients
- **Patient_Dashboard**: The landing page for users with the Patient role, summarizing upcoming appointments and active queue position
- **Patient_Book_Appointment_Page**: The page for selecting doctor, date, and time slot to create an appointment
- **Patient_My_Queue_Page**: The page that displays the patient's active queue ticket with live position updates
- **Patient_Medical_History_Page**: The page that displays the patient's past medical records and ratings
- **Patient_Settings_Page**: The page for managing patient profile, preferences, theme, font scale, and reduced-motion settings
- **Symptom_Screening_Form**: The shared form component used during appointment booking and check-in to capture pre-visit symptoms
- **Active_User**: A user who has authenticated successfully and holds a valid, non-expired JWT in the Auth_Store
- **Active_Queue_Ticket**: A queue assignment for a patient that has not yet been completed, cancelled, or marked no-show
- **Loading_State**: A visual condition indicating data is being fetched, in which the affected surface displays a skeleton placeholder, a progress indicator, or both
- **Empty_State**: A visual condition shown when a page or list has no data to display, consisting of an illustrative element, an explanatory message, and at least one suggested next action
- **Error_State**: A visual condition shown when a data fetch or mutation fails, consisting of an explanatory message and an action to retry or recover

## Requirements

### Requirement 1: Application Shell and Role-Aware Navigation

**User Story:** As an authenticated user, I want a consistent shell with navigation tailored to my role, so that I can move between pages without confusion and always see the same chrome on every page.

#### Acceptance Criteria

1. THE App_Shell SHALL render a persistent left sidebar on viewports of width 1024 pixels or greater, and SHALL collapse the sidebar into a slide-over drawer triggered by a menu button on viewports narrower than 1024 pixels
2. WHEN the Active_User has the Admin role, THE App_Shell SHALL display navigation entries for Admin_Dashboard, Admin_Doctors_Page, Admin_Schedules_Page, Admin_Patients_Page, Admin_Appointments_Page, Admin_Users_Page, Admin_Analytics_Page, and Admin_Scan_Checkin_Page
3. WHEN the Active_User has the Doctor role, THE App_Shell SHALL display navigation entries for Doctor_Dashboard, Doctor_Queue_Page, and Doctor_Medical_Records_Page
4. WHEN the Active_User has the Patient role, THE App_Shell SHALL display navigation entries for Patient_Dashboard, Patient_Book_Appointment_Page, Patient_My_Queue_Page, Patient_Medical_History_Page, and Patient_Settings_Page
5. WHEN a navigation entry corresponds to the currently active route, THE App_Shell SHALL apply a visually distinct active state to that entry using the role's category color token (--category-admin, --category-doctor, or --category-patient)
6. THE App_Shell SHALL display a top bar containing the current page title, a theme mode toggle, a notification indicator, and a user menu that exposes profile, settings, and sign-out actions
7. WHEN the user activates the sign-out action, THE Auth_Store SHALL clear the authenticated session and the Routing_Layer SHALL redirect to the Login_Page within 300 milliseconds
8. IF the Active_User attempts to navigate to a route not permitted for the user's role, THEN THE Routing_Layer SHALL redirect to the role's default landing page and the App_Shell SHALL display a non-blocking notification stating the requested page is unavailable for the current role
9. WHEN a page transition occurs, THE App_Shell SHALL preserve sidebar scroll position and SHALL apply a fade transition of duration var(--duration-normal) to the page content region only

### Requirement 2: Authentication Pages (Login and Register)

**User Story:** As a visitor, I want clear and welcoming sign-in and sign-up pages, so that I can access the application or create a patient account without friction.

#### Acceptance Criteria

1. THE Login_Page SHALL accept an email address and a password, and SHALL submit credentials to the existing authentication endpoint
2. WHEN the user submits the Login_Page form with valid credentials, THE Auth_Store SHALL persist the returned JWT and user profile, and the Routing_Layer SHALL redirect to the role-specific default landing page within 500 milliseconds
3. IF the Login_Page form is submitted with credentials that the API rejects, THEN THE Login_Page SHALL display a non-dismissive inline error message describing the failure category (invalid credentials, locked account, server unavailable) and SHALL preserve the entered email value
4. THE Register_Page SHALL accept a full name, an email address, a phone number, a date of birth, a password, and a password confirmation field
5. WHEN the user submits the Register_Page form, THE Register_Page SHALL validate that the password meets a minimum length of 8 characters, contains at least one letter and one digit, and matches the confirmation field, and SHALL block submission if validation fails
6. WHEN the Register_Page form is accepted by the API, THE Auth_Store SHALL persist the returned session and the Routing_Layer SHALL redirect to the Patient_Dashboard within 500 milliseconds
7. THE Login_Page SHALL include a link to the Register_Page and the Register_Page SHALL include a link to the Login_Page
8. WHEN either authentication form is submitting, THE submit control SHALL enter a Loading_State and SHALL prevent duplicate submissions
9. THE Login_Page and Register_Page SHALL display the MediQueue brand mark, an editorial display headline using the display typography scale, and an atmospheric background that uses only design tokens for color and surface treatment

### Requirement 3: Public Check-In Page

**User Story:** As a walk-in patient, I want to check in by scanning a QR code or entering a code manually, so that I can take a queue number without staff assistance.

#### Acceptance Criteria

1. THE Public_Checkin_Page SHALL be accessible without authentication
2. THE Public_Checkin_Page SHALL present two parallel check-in modes: QR code scanning via the device camera and manual code entry
3. WHEN the user grants camera access, THE Public_Checkin_Page SHALL initialize the html5-qrcode scanner and SHALL submit any decoded token to the existing check-in endpoint
4. IF the user denies or revokes camera access, THEN THE Public_Checkin_Page SHALL hide the scanner viewport, display a message explaining the manual code entry alternative, and focus the manual code input
5. WHEN a check-in succeeds, THE Public_Checkin_Page SHALL display a queue ticket card containing the queue number rendered using the mono-xl typography token, the assigned doctor name, the estimated wait time in minutes, and a printable summary action
6. IF the submitted token is expired, invalid, or already used, THEN THE Public_Checkin_Page SHALL display an Error_State explaining the failure category and SHALL offer a retry action
7. THE Public_Checkin_Page SHALL embed the Symptom_Screening_Form as an optional step before final ticket issuance
8. WHEN the device viewport is narrower than 640 pixels, THE Public_Checkin_Page SHALL stack the QR scanner and manual entry vertically with the scanner appearing first

### Requirement 4: TV Display Page

**User Story:** As a waiting-room patient, I want to see the live queue board on a wall-mounted display, so that I know which queue numbers are being served and where I stand.

#### Acceptance Criteria

1. THE TV_Display_Page SHALL render in fullscreen with the dark or high-contrast theme applied automatically based on the time of day or an explicit URL parameter
2. THE TV_Display_Page SHALL display, for each active doctor, the doctor name, the currently-serving queue number using the mono-xl typography token, and the next three upcoming queue numbers
3. WHEN the Realtime_Sync_Layer pushes a queue advancement event, THE TV_Display_Page SHALL update the displayed numbers within 1000 milliseconds and SHALL apply a brief highlight animation to the changed numbers using only opacity and transform properties
4. WHILE a new queue number is called, THE TV_Display_Page SHALL play an audible chime if the URL contains the parameter `sound=on`, and SHALL remain silent otherwise
5. IF the Realtime_Sync_Layer disconnects, THEN THE TV_Display_Page SHALL display a non-blocking reconnection indicator and SHALL automatically attempt reconnection using exponential backoff capped at 30 seconds
6. THE TV_Display_Page SHALL hide all App_Shell chrome (sidebar, top bar) regardless of authentication state
7. WHEN the TV_Display_Page has been idle for more than 60 seconds without a queue change, THE TV_Display_Page SHALL render a subtle ambient animation of the clinic clock and date to confirm the display is live

### Requirement 5: Admin Dashboard

**User Story:** As an admin user, I want a consolidated dashboard summarizing today's clinic activity, so that I can assess the operation at a glance and drill into details.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard mounts, THE Admin_Dashboard SHALL fetch and display the following key metrics for the current day: total appointments, total check-ins, total completed visits, total no-shows, average wait time in minutes, and active doctor count
2. THE Admin_Dashboard SHALL render each metric in a StatCard component using the design system, with the queue category color applied to wait-time metrics and the admin category color applied to staff-related metrics
3. THE Admin_Dashboard SHALL display a list of the next ten upcoming appointments for the current day, each row showing patient name, doctor name, scheduled time, and status badge
4. THE Admin_Dashboard SHALL display a list of recent check-ins from the last 30 minutes, each row showing patient name, queue number, and check-in timestamp
5. WHEN the Realtime_Sync_Layer pushes a check-in or appointment event, THE Admin_Dashboard SHALL update the affected list and metrics within 1000 milliseconds without a full page reload
6. THE Admin_Dashboard SHALL provide a quick-action region with controls to navigate to Admin_Scan_Checkin_Page, Admin_Appointments_Page, and Admin_Analytics_Page
7. IF a metric data fetch fails, THEN the affected StatCard SHALL display an Error_State with a retry action while other unaffected sections continue to render

### Requirement 6: Admin Doctors Management

**User Story:** As an admin user, I want to manage doctor profiles, so that the clinic roster reflects current staff and specialties.

#### Acceptance Criteria

1. THE Admin_Doctors_Page SHALL display a paginated list of all doctors with columns for name, specialty, license number, active status, and action menu
2. THE Admin_Doctors_Page SHALL provide a search input that filters the list by name or specialty using a debounce delay of 300 milliseconds
3. THE Admin_Doctors_Page SHALL provide filter controls for specialty and active status, and applying a filter SHALL reset pagination to the first page
4. WHEN the user activates the create action, THE Admin_Doctors_Page SHALL open a modal containing fields for full name, specialty, license number, contact phone, profile description, and active status
5. WHEN the user submits a valid create or edit form, THE Admin_Doctors_Page SHALL invalidate the doctors query cache and SHALL display a confirmation toast within 500 milliseconds of the API success response
6. WHEN the user activates the delete action on a doctor, THE Admin_Doctors_Page SHALL display a confirmation dialog explaining that associated schedules and future appointments will be affected, and SHALL require explicit confirmation before submitting the delete request
7. IF a delete request fails because the doctor has associated active appointments, THEN THE Admin_Doctors_Page SHALL display an Error_State explaining the constraint and SHALL offer a navigation action to view the affected appointments

### Requirement 7: Admin Schedules Management

**User Story:** As an admin user, I want to manage each doctor's weekly schedule and slot capacity, so that the booking system reflects real availability.

#### Acceptance Criteria

1. THE Admin_Schedules_Page SHALL allow the user to select a doctor from a searchable dropdown of active doctors
2. WHEN a doctor is selected, THE Admin_Schedules_Page SHALL display a weekly grid showing the doctor's schedule for each weekday with start time, end time, slot duration in minutes, and maximum patients per slot
3. THE Admin_Schedules_Page SHALL allow the user to add a new weekly schedule entry, edit an existing entry, or remove an entry
4. WHEN the user submits a schedule entry, THE Admin_Schedules_Page SHALL validate that start time is earlier than end time, slot duration is between 5 and 120 minutes, and maximum patients per slot is between 1 and 50
5. IF a schedule entry submission would conflict with an existing entry for the same doctor and weekday, THEN THE Admin_Schedules_Page SHALL display an Error_State identifying the conflicting entry and SHALL block submission until the conflict is resolved
6. THE Admin_Schedules_Page SHALL display a preview region showing the next seven days of bookable slots derived from the current schedule configuration

### Requirement 8: Admin Patients Management

**User Story:** As an admin user, I want to browse, search, and edit patient records, so that I can support patient enquiries and correct profile data.

#### Acceptance Criteria

1. THE Admin_Patients_Page SHALL display a paginated list of all patient records with columns for name, date of birth, phone, email, registration date, and action menu
2. THE Admin_Patients_Page SHALL provide a search input that filters the list by name, phone, or email using a debounce delay of 300 milliseconds
3. WHEN the user activates a row, THE Admin_Patients_Page SHALL navigate to a detail view that displays the patient profile, the appointment history, the medical record list, and any active queue ticket
4. WHEN the user activates the edit action, THE Admin_Patients_Page SHALL open a modal allowing modification of the editable profile fields (name, phone, email, address, emergency contact)
5. THE Admin_Patients_Page SHALL provide an export action that downloads the visible filtered list as a CSV file using the existing export endpoint
6. IF the user attempts to edit a field designated as immutable by the API (date of birth, government identifier), THEN THE Admin_Patients_Page SHALL render that field as read-only and SHALL display a tooltip explaining why the field cannot be modified

### Requirement 9: Admin Appointments Management

**User Story:** As an admin user, I want to monitor and manage all clinic appointments, so that I can resolve scheduling issues and reschedule on the patient's behalf.

#### Acceptance Criteria

1. THE Admin_Appointments_Page SHALL display a list of appointments filtered by date range, with default range set to the current day
2. THE Admin_Appointments_Page SHALL provide filters for doctor, status (scheduled, checked-in, in-consultation, completed, cancelled, no-show), and date range
3. WHEN the user activates the reschedule action, THE Admin_Appointments_Page SHALL open a modal that displays available slots for the selected doctor over the next fourteen days and SHALL submit the rescheduling request to the existing reschedule endpoint
4. WHEN the user activates the cancel action, THE Admin_Appointments_Page SHALL require entry of a cancellation reason of at least 10 characters and SHALL submit the cancellation to the API
5. WHEN an appointment status changes, THE Admin_Appointments_Page SHALL update the affected row's status badge using the appropriate accent color token (success, warning, danger, info) within 500 milliseconds of the API confirmation
6. THE Admin_Appointments_Page SHALL provide a calendar view toggle that displays appointments on a weekly calendar grid with each entry color-coded by doctor

### Requirement 10: Admin Users Management

**User Story:** As an admin user, I want to manage staff user accounts and their roles, so that access to the application is correctly granted.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL display a paginated list of all staff users with columns for name, email, role, active status, last sign-in timestamp, and action menu
2. THE Admin_Users_Page SHALL allow filtering by role (Admin, Doctor) and active status
3. WHEN the user activates the create action, THE Admin_Users_Page SHALL open a modal containing fields for full name, email, role selection, initial password, and active status
4. WHEN the user activates the edit action on a user, THE Admin_Users_Page SHALL open a modal allowing modification of role, active status, and a password reset action
5. IF the user attempts to set their own role to a non-Admin role, THEN THE Admin_Users_Page SHALL block the submission and SHALL display an Error_State explaining that an admin cannot demote the currently signed-in account
6. WHEN a password reset action is confirmed, THE Admin_Users_Page SHALL submit the request to the existing endpoint and SHALL display a success toast confirming that a temporary password has been generated

### Requirement 11: Admin Analytics

**User Story:** As an admin user, I want visualized analytics on clinic operations, so that I can identify trends and operational issues.

#### Acceptance Criteria

1. THE Admin_Analytics_Page SHALL display the following chart panels: appointment volume per day over the last 30 days, average wait time per doctor for the current week, no-show rate per doctor for the current month, and patient satisfaction rating distribution
2. THE Admin_Analytics_Page SHALL render charts using the recharts library configured to consume design system color tokens for series, axes, grid lines, and tooltips
3. THE Admin_Analytics_Page SHALL provide a date range selector that updates all charts simultaneously when a new range is applied
4. WHEN the user hovers over a chart data point, THE chart SHALL display a tooltip containing the precise value and contextual labels rendered using the body-sm typography token
5. THE Admin_Analytics_Page SHALL provide an export action that downloads the currently visible analytics summary as a CSV or PDF file using the existing export endpoint
6. WHEN the data range produces no records, THE affected chart SHALL render an Empty_State explaining that no data exists for the selected range

### Requirement 12: Admin Scan Check-In Page

**User Story:** As an admin staff member at the front counter, I want to scan patient QR tokens to assist check-in, so that walk-in patients are processed quickly.

#### Acceptance Criteria

1. THE Admin_Scan_Checkin_Page SHALL display a fullscreen camera viewport for QR token scanning
2. WHEN a token is decoded, THE Admin_Scan_Checkin_Page SHALL submit the token to the existing check-in endpoint and SHALL display the resulting queue ticket including queue number, patient name, doctor name, and estimated wait time
3. THE Admin_Scan_Checkin_Page SHALL provide a manual entry fallback identical in fields and validation to the Public_Checkin_Page manual entry mode
4. WHEN a check-in succeeds, THE Admin_Scan_Checkin_Page SHALL keep the camera active and SHALL automatically clear the displayed ticket after 10 seconds to prepare for the next patient
5. IF the camera device is unavailable or initialization fails, THEN THE Admin_Scan_Checkin_Page SHALL display an Error_State explaining the failure category and SHALL fall back to the manual entry mode

### Requirement 13: Doctor Dashboard

**User Story:** As a doctor, I want a personalized dashboard summarizing today's queue and my performance, so that I can prepare for my consultation day.

#### Acceptance Criteria

1. WHEN the Doctor_Dashboard mounts, THE Doctor_Dashboard SHALL fetch and display the following metrics for the signed-in doctor on the current day: total scheduled appointments, total checked-in patients waiting, total completed consultations, and average consultation duration in minutes
2. THE Doctor_Dashboard SHALL render each metric in a StatCard using the doctor category color token
3. THE Doctor_Dashboard SHALL display the next three upcoming patients including patient name, scheduled time, queue number, and a quick-call action that navigates to Doctor_Queue_Page with the row preselected
4. THE Doctor_Dashboard SHALL display a panel summarizing the doctor's average rating over the last 30 days using the StarRating component and the rating count
5. WHEN the Realtime_Sync_Layer pushes a check-in event for the signed-in doctor, THE Doctor_Dashboard SHALL update the affected metric and the upcoming patient list within 1000 milliseconds

### Requirement 14: Doctor Queue Page

**User Story:** As a doctor, I want to manage my live patient queue, so that I can call the next patient and update consultation status efficiently.

#### Acceptance Criteria

1. THE Doctor_Queue_Page SHALL display three vertical lanes labeled Waiting, In Consultation, and Completed, each lane listing the relevant patient cards
2. Each patient card SHALL display the queue number using the mono-lg typography token, the patient name, the appointment scheduled time, and any chief complaint summary from the symptom screening
3. THE Doctor_Queue_Page SHALL provide a "Call Next" action that promotes the first Waiting card to the In Consultation lane, advancing the global queue number for the doctor
4. THE Doctor_Queue_Page SHALL provide per-card actions for Mark In Consultation, Complete Consultation, and Mark No-Show
5. WHEN a card transitions between lanes, THE Doctor_Queue_Page SHALL animate the move using transform and opacity properties only with a duration of var(--duration-normal)
6. WHEN the user activates Complete Consultation on a card, THE Doctor_Queue_Page SHALL prompt for or open the medical record creation form and SHALL block the lane transition until the form is submitted or explicitly skipped
7. WHEN the Realtime_Sync_Layer pushes a queue change event, THE Doctor_Queue_Page SHALL reconcile its local state with the server state within 1000 milliseconds and SHALL preserve any in-progress form input
8. IF a queue mutation request fails, THEN THE Doctor_Queue_Page SHALL revert the optimistic UI change, display a non-blocking error toast describing the failure, and offer a retry action

### Requirement 15: Doctor Medical Records

**User Story:** As a doctor, I want to browse and create medical records for my patients, so that I can document consultations and review patient history.

#### Acceptance Criteria

1. THE Doctor_Medical_Records_Page SHALL display a paginated list of medical records authored by the signed-in doctor with columns for patient name, visit date, chief complaint, diagnosis summary, and action menu
2. THE Doctor_Medical_Records_Page SHALL provide a search input that filters the list by patient name or diagnosis using a debounce delay of 300 milliseconds
3. THE Doctor_Medical_Records_Page SHALL provide a date-range filter that defaults to the last 30 days
4. WHEN the user activates a record row, THE Doctor_Medical_Records_Page SHALL navigate to a detail view containing the full record fields (chief complaint, history, examination, diagnosis, treatment plan, prescriptions, follow-up notes)
5. WHEN the user activates the create action from the Doctor_Queue_Page or directly from the Doctor_Medical_Records_Page, THE Doctor_Medical_Records_Page SHALL render a creation form preloaded with the linked patient and appointment context
6. THE creation form SHALL validate that chief complaint, diagnosis, and treatment plan are non-empty and that each text area accepts no more than 5000 characters
7. THE Doctor_Medical_Records_Page SHALL provide an export action that downloads the selected medical record as a PDF file using the existing export endpoint

### Requirement 16: Patient Dashboard

**User Story:** As a patient, I want a dashboard showing my upcoming appointments and live queue position, so that I always know what is next.

#### Acceptance Criteria

1. WHEN the Patient_Dashboard mounts, THE Patient_Dashboard SHALL fetch and display the patient's next upcoming appointment if any exists, including doctor name, scheduled date and time, and a check-in status indicator
2. WHEN the patient has an Active_Queue_Ticket, THE Patient_Dashboard SHALL display a hero card containing the queue number using the mono-xl typography token, the doctor name, the patient's current position, the estimated wait in minutes, and a "View Live Queue" action
3. THE Patient_Dashboard SHALL display StatCards for total upcoming appointments and total completed visits using the patient category color token
4. THE Patient_Dashboard SHALL display a list of the most recent three medical records, each row showing visit date, doctor name, and diagnosis summary
5. THE Patient_Dashboard SHALL provide quick-action controls for Patient_Book_Appointment_Page and Patient_My_Queue_Page
6. IF the patient has no upcoming appointment and no Active_Queue_Ticket, THEN THE Patient_Dashboard SHALL display an Empty_State inviting the patient to book an appointment

### Requirement 17: Patient Book Appointment Page

**User Story:** As a patient, I want a guided booking flow for selecting a doctor, date, and time, so that I can schedule a visit without confusion.

#### Acceptance Criteria

1. THE Patient_Book_Appointment_Page SHALL present a three-step flow: select doctor, select date and time, confirm and submit
2. WHEN the user enters the select-doctor step, THE Patient_Book_Appointment_Page SHALL display a list of active doctors filterable by specialty, each card showing name, specialty, average rating, and the next available slot date
3. WHEN the user enters the select-date-and-time step, THE Patient_Book_Appointment_Page SHALL display a calendar limited to the next 30 days with each day annotated by the count of available slots, and a list of time slots for the selected day
4. WHEN the user selects a slot, THE Patient_Book_Appointment_Page SHALL embed the Symptom_Screening_Form requesting chief complaint and symptom severity
5. WHEN the user submits the confirm step, THE Patient_Book_Appointment_Page SHALL submit the appointment payload to the existing endpoint and SHALL navigate to the Patient_My_Queue_Page or the Patient_Dashboard upon success
6. IF the selected slot is no longer available because another patient has booked it concurrently, THEN THE Patient_Book_Appointment_Page SHALL display an Error_State, refresh the slot list, and return the user to the select-date-and-time step
7. WHEN the user navigates between steps, THE Patient_Book_Appointment_Page SHALL preserve all entered data unless the user explicitly cancels the flow

### Requirement 18: Patient My Queue Page

**User Story:** As a patient with an active queue ticket, I want a live view of my queue position, so that I know when I will be called.

#### Acceptance Criteria

1. WHEN the patient has an Active_Queue_Ticket, THE Patient_My_Queue_Page SHALL display the queue number using the mono-xl typography token, the doctor name, the currently-serving queue number for that doctor, the patient's current position, and the estimated wait time in minutes
2. THE Patient_My_Queue_Page SHALL display a progress visualization indicating how close the patient is to being called, where the visualization uses transform and opacity transitions only
3. WHEN the Realtime_Sync_Layer pushes a queue advancement event, THE Patient_My_Queue_Page SHALL update the displayed values within 1000 milliseconds
4. WHEN the patient's position becomes 1 (next to be called), THE Patient_My_Queue_Page SHALL display a prominent "You are next" notice and SHALL trigger a single non-modal alert notification within the page
5. WHEN the patient's queue ticket transitions to In Consultation status, THE Patient_My_Queue_Page SHALL display a confirmation message and SHALL hide the queue position visualization
6. IF the patient does not have an Active_Queue_Ticket, THEN THE Patient_My_Queue_Page SHALL display an Empty_State explaining that no active queue exists and SHALL provide a navigation action to Patient_Book_Appointment_Page or Public_Checkin_Page

### Requirement 19: Patient Medical History Page

**User Story:** As a patient, I want to review my past medical records and submit ratings, so that I can track my care and provide feedback.

#### Acceptance Criteria

1. THE Patient_Medical_History_Page SHALL display a chronological list of the patient's past medical records, each row showing visit date, doctor name, chief complaint, and diagnosis summary
2. WHEN the user activates a row, THE Patient_Medical_History_Page SHALL navigate to a detail view containing the full record contents in read-only form
3. THE Patient_Medical_History_Page SHALL display a rating action on each completed visit row that has not yet been rated by the patient
4. WHEN the user activates the rating action, THE Patient_Medical_History_Page SHALL open a modal containing a 1-to-5 star input using the StarRating component and an optional comment field of up to 1000 characters
5. WHEN the user submits a rating, THE Patient_Medical_History_Page SHALL submit the rating to the existing endpoint and SHALL update the row to indicate the rating has been recorded
6. THE Patient_Medical_History_Page SHALL provide an export action that downloads the patient's medical history summary as a PDF file

### Requirement 20: Patient Settings Page

**User Story:** As a patient, I want to manage my profile and visual preferences, so that the application reflects my information and accommodates my accessibility needs.

#### Acceptance Criteria

1. THE Patient_Settings_Page SHALL display the patient profile (name, email, phone, date of birth, address, emergency contact) in editable fields except those marked immutable by the API
2. WHEN the user submits a profile change, THE Patient_Settings_Page SHALL submit the change to the existing endpoint and SHALL display a confirmation toast within 500 milliseconds of the API success response
3. THE Patient_Settings_Page SHALL expose controls bound to the Theme_Store for theme mode (light, dark, high-contrast), font scale (0.875, 1, 1.125, 1.25), and reduced motion preference
4. WHEN the user changes a theme setting, THE Theme_Resolver SHALL apply the new setting within a single animation frame and the Theme_Store SHALL persist the change to localStorage
5. THE Patient_Settings_Page SHALL provide a password change form requiring the current password and a new password that meets the minimum complexity rule of 8 characters with at least one letter and one digit
6. THE Patient_Settings_Page SHALL provide an account deletion action that requires explicit confirmation by typing the word "DELETE" and SHALL submit the request to the existing endpoint upon confirmation

### Requirement 21: Visual Design System Adherence

**User Story:** As a maintainer, I want every overhauled page to consume the existing design token and component library, so that the visual language stays consistent and themable.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL use only CSS custom property references from the existing tokens.css for color, spacing, radii, motion, and elevation values across all overhauled pages
2. THE MediQueue_Frontend SHALL use the migrated Button, Card, and StatCard components from the design system rather than introducing parallel implementations of those primitives
3. THE MediQueue_Frontend SHALL use the typography scale from type.css (display, heading, body, label, mono) for all text elements rather than ad-hoc font-size declarations
4. THE MediQueue_Frontend SHALL apply category color tokens consistently: --category-admin for Admin chrome and metrics, --category-doctor for Doctor chrome and metrics, --category-patient for Patient chrome and metrics, and --category-queue for queue-number and wait-time elements regardless of page
5. THE MediQueue_Frontend SHALL use the useStaggerReveal hook for list and grid reveals on dashboard pages
6. WHERE a page introduces a visual element not covered by an existing primitive, THE MediQueue_Frontend SHALL compose the element from existing tokens and Radix primitives without adding new external UI dependencies

### Requirement 22: Responsive Layout

**User Story:** As a user on any device, I want every page to adapt to my screen size, so that I can use the application on phone, tablet, or desktop.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL render all overhauled pages without horizontal scrollbar at viewport widths of 320 pixels, 768 pixels, 1024 pixels, and 1440 pixels
2. WHEN the viewport width is less than 768 pixels, THE App_Shell SHALL collapse the sidebar into a slide-over drawer and SHALL stack multi-column page layouts into single-column layouts
3. WHEN the viewport width is between 768 pixels and 1023 pixels, THE App_Shell SHALL display the sidebar in icon-only collapsed mode and SHALL render two-column page layouts where space permits
4. THE MediQueue_Frontend SHALL ensure that interactive controls have a minimum tap target size of 44 by 44 pixels at viewport widths below 768 pixels
5. THE MediQueue_Frontend SHALL ensure that data tables on Admin pages convert to stacked card lists at viewport widths below 768 pixels with the same fields visible
6. THE TV_Display_Page SHALL render at viewport widths of 1920 pixels and 3840 pixels without text truncation or content overflow

### Requirement 23: Accessibility Compliance

**User Story:** As a user with assistive needs, I want every page to be navigable and readable with assistive technology, so that I can use the application independently.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL ensure that every interactive element is reachable via keyboard navigation in a logical tab order matching visual order
2. THE MediQueue_Frontend SHALL ensure that every interactive element displays a visible focus-visible ring with a minimum width of 2 pixels and a contrast ratio of at least 3:1 against adjacent colors
3. THE MediQueue_Frontend SHALL provide accessible names for all icon-only buttons via aria-label attributes
4. THE MediQueue_Frontend SHALL provide live region announcements for queue position changes on Patient_My_Queue_Page and for new check-ins on Admin_Dashboard using aria-live="polite"
5. THE MediQueue_Frontend SHALL ensure that all form inputs have associated labels and that validation error messages are announced to assistive technology via aria-describedby
6. THE MediQueue_Frontend SHALL respect the prefers-reduced-motion operating system preference and the Theme_Store reducedMotion setting on every page
7. THE MediQueue_Frontend SHALL ensure body text contrast is at least 4.5:1 and large text contrast is at least 3:1 against the background surface in each theme mode
8. THE MediQueue_Frontend SHALL ensure that role-restricted error states announce their state via aria-live and use color in combination with text or icon to convey meaning

### Requirement 24: Performance

**User Story:** As a user, I want every page to load quickly and remain responsive, so that the application does not waste my time.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL achieve a Largest Contentful Paint of less than 2.5 seconds at the 75th percentile on a simulated 4G connection for the Login_Page, Patient_Dashboard, Doctor_Queue_Page, and Admin_Dashboard
2. THE MediQueue_Frontend SHALL achieve a Cumulative Layout Shift of less than 0.05 on every overhauled page during initial load and during theme switches
3. THE MediQueue_Frontend SHALL achieve a First Input Delay of less than 100 milliseconds at the 75th percentile across all interactive pages
4. THE MediQueue_Frontend SHALL lazy-load route components for Admin_Analytics_Page, Doctor_Medical_Records_Page, and TV_Display_Page using react-router-dom's lazy import mechanism
5. THE MediQueue_Frontend SHALL ensure the production JavaScript bundle adds no more than 50 kilobytes gzipped beyond the size measured at the completion of the `frontend-design-migration` spec, excluding lazy-loaded routes
6. WHEN a list view contains more than 50 rows, THE MediQueue_Frontend SHALL apply windowed rendering or pagination so that no more than 50 row components are mounted in the DOM at any time

### Requirement 25: Real-Time Data Freshness

**User Story:** As a user of pages that depend on live state, I want updates to appear without manually refreshing, so that I always see current information.

#### Acceptance Criteria

1. THE Realtime_Sync_Layer SHALL maintain a single shared WebSocket connection per browser tab regardless of how many subscribed pages are mounted
2. WHEN a page that consumes real-time events mounts, THE Realtime_Sync_Layer SHALL subscribe to the relevant event channels and unsubscribe on unmount
3. WHEN the WebSocket disconnects unexpectedly, THE Realtime_Sync_Layer SHALL attempt automatic reconnection using exponential backoff starting at 1 second and capped at 30 seconds
4. WHILE the WebSocket is disconnected, THE affected pages SHALL display a non-blocking indicator showing live updates are unavailable and SHALL fall back to polling the relevant query at a 30-second interval
5. WHEN the WebSocket reconnects, THE Realtime_Sync_Layer SHALL resubscribe all active channels and trigger a one-time refetch of the relevant TanStack Query caches
6. THE MediQueue_Frontend SHALL set TanStack Query staleTime values appropriate to each data domain such that semi-static data (doctor list, schedule list) is not refetched on every page mount

### Requirement 26: Error Handling and Resilience

**User Story:** As a user when something goes wrong, I want clear feedback and a path to recovery, so that I am not stuck on a broken page.

#### Acceptance Criteria

1. WHEN an API request fails with a network error, THE affected page SHALL display an Error_State containing a message describing the failure category and a retry action
2. WHEN an API request fails with a 401 Unauthorized response, THE Auth_Store SHALL clear the session and the Routing_Layer SHALL redirect to the Login_Page within 300 milliseconds
3. WHEN an API request fails with a 403 Forbidden response, THE affected page SHALL display an Error_State explaining that the requested action is not permitted for the current role
4. WHEN an API request fails with a 5xx server error, THE affected page SHALL display an Error_State and SHALL automatically retry the request once after 2 seconds before requiring manual retry
5. WHEN an unexpected client-side exception occurs within a page, THE existing ErrorBoundary SHALL catch the exception, display a recovery screen with a reload action, and report the error to the console without exposing stack traces to the user
6. WHEN a form submission is in flight, THE form SHALL prevent duplicate submissions by disabling the submit control and applying a Loading_State

### Requirement 27: Security and Data Protection

**User Story:** As a clinic stakeholder, I want frontend code to handle credentials and patient data safely, so that the system does not become an attack surface.

#### Acceptance Criteria

1. THE Auth_Store SHALL persist the JWT to localStorage only when the user explicitly enables a "remember me" preference, and SHALL persist to sessionStorage by default
2. THE MediQueue_Frontend SHALL never log JWTs, passwords, or full patient identifiers to the browser console in production builds
3. THE MediQueue_Frontend SHALL transmit all API requests over HTTPS in production environments and SHALL block API requests over plain HTTP except when the API base URL host is localhost or 127.0.0.1
4. THE MediQueue_Frontend SHALL render all user-supplied content (chief complaint, comment, address, emergency contact) using React's default text-rendering pathway without dangerouslySetInnerHTML
5. WHEN the JWT expires while the user is active, THE API_Client SHALL detect the resulting 401 response, attempt a single token refresh against the existing refresh endpoint, and retry the failed request once before forcing sign-out
6. THE MediQueue_Frontend SHALL clear all role-specific cached data from TanStack Query when the Auth_Store transitions from authenticated to unauthenticated

### Requirement 28: Internationalization and Locale

**User Story:** As an Indonesian clinic user, I want the interface in Indonesian by default with date and number formatting that matches local conventions, so that the application feels native.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL render all user-facing strings in Indonesian (id-ID) as the default locale across every overhauled page
2. THE MediQueue_Frontend SHALL format all dates using the `id-ID` locale with the date-fns library and SHALL render time values using a 24-hour format
3. THE MediQueue_Frontend SHALL format all numeric values that represent counts, durations, and currencies using the `id-ID` locale conventions
4. WHERE a string is intended for medical or technical accuracy and lacks an established Indonesian translation, THE MediQueue_Frontend SHALL retain the English term and present the Indonesian explanation as supporting text
5. THE MediQueue_Frontend SHALL store all user-facing strings in a single lookup module so that adding additional locales in the future requires no changes to page components

### Requirement 29: System Design Deliverables

**User Story:** As a stakeholder reviewing the design phase, I want use case, activity, and data flow diagrams documenting the overhaul, so that the system behavior is communicated clearly to non-engineers.

#### Acceptance Criteria

1. THE design phase SHALL produce one use case diagram per role (Admin, Doctor, Patient) that enumerates every actor-system interaction defined in Requirements 5 through 20
2. THE design phase SHALL produce activity diagrams for each of the following major flows: patient appointment booking (Requirement 17), patient walk-in check-in (Requirement 3), doctor queue management call-and-complete cycle (Requirement 14), admin scan check-in (Requirement 12), and admin appointment reschedule (Requirement 9)
3. THE design phase SHALL produce data flow diagrams that show, for each major flow, how data moves between the user, the page component, the TanStack Query cache, the API_Client, the Realtime_Sync_Layer, and the backend API
4. THE design phase SHALL include a navigation map that documents every route, its role gate, and the parent and child relationships among pages
5. THE design phase SHALL include a state ownership map that identifies, for each piece of mutable state used by overhauled pages, whether the state is owned by a Zustand store, the TanStack Query cache, component-local state, or the URL
6. WHERE a diagram is rendered in the design document, THE design document SHALL use Mermaid syntax so that diagrams render in the spec viewer without external tooling

### Requirement 30: Non-Destructive Migration Constraints

**User Story:** As a maintainer, I want the overhaul to preserve every existing backend contract and frontend integration point, so that no regression is introduced into working systems.

#### Acceptance Criteria

1. THE MediQueue_Frontend SHALL preserve every existing react-router-dom route path so that bookmarked URLs continue to resolve to the corresponding overhauled page
2. THE MediQueue_Frontend SHALL preserve the existing API_Client request and response contracts and SHALL NOT introduce changes to backend endpoints, request shapes, or response shapes
3. THE MediQueue_Frontend SHALL preserve the existing Auth_Store, theme-store, and theme-resolver public interfaces, extending those interfaces only by addition of new optional properties when required
4. THE MediQueue_Frontend SHALL preserve the existing TanStack Query key structure so that ongoing cache invalidation patterns remain valid
5. THE MediQueue_Frontend SHALL preserve the existing WebSocket event names and payload shapes consumed from the Realtime_Sync_Layer
6. WHEN the overhauled MediQueue_Frontend is deployed, the existing backend service SHALL operate without modification or redeployment
