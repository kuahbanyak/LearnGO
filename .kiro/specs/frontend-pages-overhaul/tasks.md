# Implementation Plan: Frontend Pages Overhaul

## Overview

This plan implements the complete page-level overhaul of MediQueue's frontend, applying the "soft machine medical" design system across all Admin, Doctor, Patient, and Public pages. Implementation proceeds in layers: shared infrastructure first (types, hooks, i18n, shared components), then page rewrites grouped by role, and finally integration wiring and testing.

## Tasks

- [x] 1. Shared infrastructure and core utilities
  - [x] 1.1 Extend TypeScript types and data models
    - Add `QueueTicket`, `QueueUpdateEvent`, `CheckinEvent`, `AppointmentStatusEvent`, `AdminDashboardStats`, `DoctorDashboardStats`, `PatientDashboardData`, `SymptomScreening`, `AnalyticsData` interfaces to `src/types/index.ts`
    - Add status type unions and string key type
    - _Requirements: 5.1, 13.1, 14.2, 16.2, 18.1, 25.1_

  - [x] 1.2 Create Zod validation schemas
    - Create `src/lib/validations/schemas.ts` with `passwordSchema`, `scheduleEntrySchema`, `medicalRecordSchema`, `cancellationSchema`, `ratingSchema`, `deleteAccountSchema`
    - _Requirements: 2.5, 7.4, 9.4, 15.6, 19.4, 20.5, 20.6_

  - [x]* 1.3 Write property tests for validation schemas
    - **Property 3: Password Complexity Validation**
    - **Property 10: Schedule Entry Validation**
    - **Property 13: Text Length Validation**
    - **Property 21: Account Deletion Confirmation**
    - **Validates: Requirements 2.5, 7.4, 9.4, 15.6, 19.4, 20.5, 20.6**

  - [x] 1.4 Create i18n locale module
    - Create `src/lib/i18n/id-ID.ts` with all Indonesian string constants (navigation, actions, errors, labels, empty states)
    - Create `src/lib/i18n/format.ts` with `formatDate`, `formatTime`, `formatDateTime`, `formatRelative`, `formatNumber`, `formatDuration` using date-fns id locale
    - Create `src/lib/i18n/index.ts` as module entry point with `t()` lookup function
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5_

  - [x]* 1.5 Write property tests for i18n formatting
    - **Property 28: Locale-Correct Formatting**
    - **Validates: Requirements 28.2, 28.3**

  - [x] 1.6 Create `use-realtime-sync` hook (WebSocket singleton)
    - Create `src/hooks/use-realtime-sync.ts` implementing `RealtimeSyncLayer` interface
    - Single connection per tab, channel-based subscription, exponential backoff (1s → 30s cap)
    - Polling fallback at 30s when disconnected, refetch on reconnect
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [x]* 1.7 Write property tests for WebSocket reconnection logic
    - **Property 6: Exponential Backoff Reconnection**
    - **Validates: Requirements 4.5, 25.3**

  - [x] 1.8 Create `use-debounced-search` hook
    - Create `src/hooks/use-debounced-search.ts` with 300ms debounce delay
    - Returns debounced value and immediate value for controlled input
    - _Requirements: 6.2, 8.2, 15.2_

  - [x]* 1.9 Write property tests for debounced search
    - **Property 8: Debounced Search**
    - **Validates: Requirements 6.2, 8.2, 15.2**

  - [x] 1.10 Extend TanStack Query keys
    - Extend `src/lib/query-keys.ts` with keys for `dashboard.admin()`, `dashboard.doctor()`, `dashboard.patient()`, `appointments.todayQueue()`, `appointments.my()`, `analytics.all`, `medicalRecords.*`, `ratings.*` with appropriate staleTime/gcTime values
    - _Requirements: 25.6, 30.4_

- [x] 2. Shared UI components
  - [x] 2.1 Create PageHeader component
    - Create `src/components/shared/page-header.tsx` with title (display-lg), optional subtitle, action slot, and category color prop
    - _Requirements: 21.3, 21.4_

  - [x] 2.2 Create DataTable component
    - Create `src/components/shared/data-table.tsx` with Column interface, pagination, sorting, search, row click, empty state, and responsive card fallback at <768px
    - _Requirements: 6.1, 8.1, 10.1, 15.1, 22.5_

  - [x] 2.3 Create EmptyState component
    - Create `src/components/shared/empty-state.tsx` with icon (Lucide 48px), title (heading-md), description (body-md), and optional action button
    - _Requirements: 16.6, 18.6_

  - [x] 2.4 Create ErrorState component
    - Create `src/components/shared/error-state.tsx` with title, message, category (network/forbidden/server/validation), retry action, and ARIA role="alert" or aria-live
    - _Requirements: 26.1, 26.3, 26.4, 23.8_

  - [x] 2.5 Create LoadingSkeleton component
    - Create `src/components/shared/loading-skeleton.tsx` with variants: card, table-row, stat-card, form, list-item; shimmer animation respecting reduced-motion
    - _Requirements: 24.2, 23.6_

  - [x] 2.6 Create QueueTicketCard component
    - Create `src/components/shared/queue-ticket-card.tsx` with queue number (mono-xl), doctor name, estimated wait, optional patient name, and print action
    - _Requirements: 3.5, 12.2, 18.1_

  - [x]* 2.7 Write property tests for QueueTicketCard
    - **Property 5: Queue Ticket Rendering Completeness**
    - **Validates: Requirements 3.5, 4.2, 14.2, 16.2, 18.1**

  - [x] 2.8 Create DisconnectionBanner component
    - Create `src/components/shared/disconnection-banner.tsx` with non-blocking banner, aria-live="polite", last-updated timestamp
    - _Requirements: 4.5, 25.4_

  - [x] 2.9 Create ConfirmationDialog component
    - Create `src/components/shared/confirmation-dialog.tsx` with title, message, confirm/cancel actions, focus trap, and Escape to close
    - _Requirements: 6.6, 9.4, 20.6_

  - [x]* 2.10 Write unit tests for shared UI components
    - Test DataTable responsive fallback, EmptyState rendering, ErrorState ARIA attributes, LoadingSkeleton variants
    - _Requirements: 22.5, 23.5, 23.8_

- [x] 3. App Shell and navigation overhaul
  - [x] 3.1 Rewrite MainLayout with responsive sidebar
    - Rewrite `src/components/layout/main-layout.tsx` with persistent sidebar (≥1024px), icon-only (768-1023px), drawer (<768px)
    - Implement fade transition (var(--duration-normal)) on page content region
    - Preserve sidebar scroll position across route changes
    - _Requirements: 1.1, 1.9, 22.2, 22.3_

  - [x] 3.2 Rewrite Sidebar with role-aware navigation
    - Rewrite `src/components/layout/sidebar.tsx` with `getNavItems(role)` function
    - Apply category color token to active nav item
    - Include aria-current="page" on active item, aria-label on nav element
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 23.1_

  - [x]* 3.3 Write property tests for role-to-navigation mapping
    - **Property 1: Role-to-Navigation Mapping**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 3.4 Implement TopBar component
    - Add top bar to MainLayout with page title (derived from route), theme toggle, notification indicator, user menu (profile, settings, sign-out)
    - _Requirements: 1.6_

  - [x] 3.5 Update ProtectedRoute with role redirect and notification
    - Update `src/components/shared/protected-route.tsx` to redirect unauthorized roles to their default landing page and show non-blocking notification
    - Implement sign-out action: clear Auth_Store → redirect to /login within 300ms
    - _Requirements: 1.7, 1.8, 26.2_

  - [x]* 3.6 Write property tests for route protection
    - **Property 2: Unauthorized Route Redirect**
    - **Property 23: 401 Session Termination**
    - **Validates: Requirements 1.8, 26.2**

- [x] 4. Checkpoint - Ensure shared infrastructure works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Authentication pages overhaul
  - [x] 5.1 Restyle LoginPage
    - Restyle `src/pages/auth/login.tsx` with atmospheric background (design tokens), brand mark, display headline (display-lg), react-hook-form + zod validation
    - Implement non-dismissive inline error (preserves email), loading state on submit, duplicate submission prevention
    - Add link to Register, "remember me" checkbox controlling JWT storage strategy
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8, 2.9, 27.1_

  - [x]* 5.2 Write property tests for login behavior
    - **Property 4: Login Success Routes to Role Landing**
    - **Property 25: Form Duplicate Submission Prevention**
    - **Property 26: JWT Storage Strategy**
    - **Validates: Requirements 2.2, 26.6, 27.1**

  - [x] 5.3 Restyle RegisterPage
    - Restyle `src/pages/auth/register.tsx` with atmospheric background, brand mark, display headline
    - Implement full name, email, phone, date of birth, password, password confirmation fields with zod validation (password complexity)
    - Add link to Login, loading state, duplicate submission prevention
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 6. Public pages overhaul
  - [x] 6.1 Restyle and extend PublicCheckinPage
    - Restyle `src/pages/public/check-in.tsx` with dual-mode check-in (QR scan + manual entry)
    - Implement camera permission handling: show scanner on grant, fallback to manual on deny
    - Embed SymptomScreeningForm as optional step before ticket issuance
    - Display QueueTicketCard on success with mono-xl queue number, doctor, wait time, print action
    - Handle error states (expired/invalid/used token) with retry
    - Responsive: stack vertically at <640px
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.2 Rewrite TVDisplayPage
    - Rewrite `src/pages/admin/tv-display.tsx` as fullscreen dark/high-contrast page (no App Shell)
    - Display per-doctor columns: doctor name, currently-serving (mono-xl + highlight animation), next three queue numbers
    - Integrate use-realtime-sync for queue_update events (update within 1000ms)
    - Implement reconnection indicator, idle animation after 60s, optional audio chime (sound=on URL param)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 7. Admin pages overhaul
  - [x] 7.1 Rewrite AdminDashboard
    - Rewrite `src/pages/admin/dashboard.tsx` with 6 StatCards (stagger reveal), quick-action bar, upcoming appointments list (next 10), recent check-ins list (last 30 min)
    - Integrate use-realtime-sync for `checkin` and `appointment_status` events (update within 1000ms)
    - Implement partial failure isolation: individual StatCard error states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x]* 7.2 Write property tests for partial failure isolation
    - **Property 7: Partial Failure Isolation**
    - **Validates: Requirements 5.7, 11.6**

  - [x] 7.3 Rewrite AdminDoctorsPage
    - Rewrite `src/pages/admin/doctors.tsx` with DataTable (paginated), debounced search (name/specialty), filter by specialty/active status
    - Implement create/edit modal (full name, specialty, license, phone, description, active status)
    - Implement delete with confirmation dialog (explain schedule/appointment impact)
    - Handle delete failure (active appointments constraint) with error state + navigation
    - Invalidate doctors query cache on success, show confirmation toast
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x]* 7.4 Write property tests for filter/pagination behavior
    - **Property 9: Filter Resets Pagination**
    - **Validates: Requirements 6.3**

  - [x] 7.5 Rewrite AdminSchedulesPage
    - Rewrite `src/pages/admin/schedules.tsx` with searchable doctor dropdown, weekly grid (start/end time, slot duration, max patients per slot)
    - Implement add/edit/remove schedule entries with validation (start < end, duration 5-120, max patients 1-50)
    - Implement conflict detection (same doctor, same weekday, overlapping times)
    - Display 7-day preview of bookable slots
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 7.6 Write property tests for schedule validation
    - **Property 10: Schedule Entry Validation**
    - **Property 11: Schedule Conflict Detection**
    - **Validates: Requirements 7.4, 7.5**

  - [x] 7.7 Rewrite AdminPatientsPage
    - Rewrite `src/pages/admin/patients.tsx` with DataTable (paginated), debounced search (name/phone/email)
    - Implement row click → detail view (profile, appointment history, medical records, active queue ticket)
    - Implement edit modal with immutable field protection (date of birth, government ID rendered read-only with tooltip)
    - Implement CSV export action
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x]* 7.8 Write property tests for immutable field protection
    - **Property 12: Immutable Field Protection**
    - **Validates: Requirements 8.6**

  - [x] 7.9 Rewrite AdminAppointmentsPage
    - Rewrite `src/pages/admin/appointments.tsx` with date-range filtered list (default: today), filters for doctor/status/date range
    - Implement reschedule modal: fetch available slots for next 14 days, submit to reschedule endpoint
    - Implement cancel action: require reason ≥10 chars, submit cancellation
    - Implement calendar view toggle (weekly grid, color-coded by doctor)
    - Update status badges with accent color tokens on status change (within 500ms)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 7.10 Rewrite AdminUsersPage
    - Rewrite `src/pages/admin/users.tsx` with DataTable (paginated), filter by role/active status
    - Implement create modal (name, email, role, initial password, active status)
    - Implement edit modal (role, active status, password reset action)
    - Implement self-demotion prevention: block admin from changing own role to non-Admin
    - Show success toast on password reset
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x]* 7.11 Write property tests for self-demotion prevention
    - **Property 14: Self-Demotion Prevention**
    - **Validates: Requirements 10.5**

  - [x] 7.12 Rewrite AdminAnalyticsPage
    - Rewrite `src/pages/admin/analytics.tsx` with recharts panels: appointment volume (30 days), avg wait by doctor (week), no-show rate by doctor (month), satisfaction distribution
    - Configure charts with design system color tokens for series/axes/grid/tooltips
    - Implement date range selector updating all charts simultaneously
    - Implement tooltip with body-sm typography, export action (CSV/PDF)
    - Handle empty data ranges with EmptyState per chart
    - Lazy-load this page via React.lazy
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 24.4_

  - [x] 7.13 Rewrite AdminScanCheckinPage
    - Rewrite `src/pages/admin/scan-checkin.tsx` with fullscreen camera viewport for QR scanning
    - Submit decoded token to check-in endpoint, display queue ticket (queue#, patient, doctor, wait time)
    - Implement manual entry fallback (same fields/validation as PublicCheckinPage)
    - Auto-clear displayed ticket after 10 seconds, keep camera active
    - Handle camera initialization failure with ErrorState + manual fallback
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 8. Checkpoint - Ensure admin pages work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Doctor pages overhaul
  - [x] 9.1 Rewrite DoctorDashboard
    - Rewrite `src/pages/doctor/dashboard.tsx` with 4 StatCards (scheduled, waiting, completed, avg consultation duration) using doctor category color
    - Display next 3 upcoming patients with quick-call action → navigate to queue page
    - Display rating summary panel (StarRating component, avg rating 30 days, count)
    - Integrate use-realtime-sync for `checkin` events (update within 1000ms)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 9.2 Rewrite DoctorQueuePage
    - Rewrite `src/pages/doctor/queue.tsx` with 3 vertical lanes (Waiting, In Consultation, Completed)
    - Each PatientCard: queue number (mono-lg), patient name, scheduled time, chief complaint, action menu
    - Implement "Call Next" action promoting first Waiting → In Consultation
    - Implement per-card actions: Mark In Consultation, Complete, No-Show
    - Animate card transitions (transform + opacity, var(--duration-normal))
    - On Complete: prompt medical record form, block transition until submitted or explicitly skipped
    - Integrate use-realtime-sync for queue_update events (reconcile within 1000ms, preserve in-progress form)
    - Implement optimistic mutations with revert on API failure + error toast
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [x]* 9.3 Write property tests for queue management
    - **Property 15: Queue Call-Next Ordering**
    - **Property 16: Completion Gate**
    - **Property 17: Optimistic Mutation Revert**
    - **Validates: Requirements 14.3, 14.6, 14.8**

  - [x] 9.4 Rewrite DoctorMedicalRecordsPage
    - Rewrite `src/pages/doctor/medical-records.tsx` with DataTable (paginated), debounced search (patient/diagnosis), date-range filter (default: last 30 days)
    - Implement row click → detail view (chief complaint, history, examination, diagnosis, treatment plan, prescriptions, follow-up)
    - Implement creation form preloaded with linked patient/appointment context
    - Validate: chief complaint, diagnosis, treatment plan non-empty, max 5000 chars each
    - Implement PDF export action
    - Lazy-load this page via React.lazy
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 24.4_

  - [x] 9.5 Restyle DoctorMedicalRecordForm
    - Restyle `src/pages/doctor/medical-record-form.tsx` applying design tokens, typography scale, form validation UX
    - Preserve existing logic, add zod validation for field lengths
    - _Requirements: 15.6_

- [x] 10. Patient pages overhaul
  - [x] 10.1 Rewrite PatientDashboard
    - Rewrite `src/pages/patient/dashboard.tsx` with next upcoming appointment card (doctor, date/time, check-in status)
    - Display hero queue card when Active_Queue_Ticket exists (mono-xl queue number, doctor, position, wait, "View Live Queue" action)
    - Display StatCards (upcoming appointments, completed visits) with patient category color
    - Display recent 3 medical records (date, doctor, diagnosis)
    - Quick-action controls for Book Appointment and My Queue
    - EmptyState when no appointments and no queue ticket
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 10.2 Rewrite BookAppointmentPage (3-step wizard)
    - Rewrite `src/pages/patient/book-appointment.tsx` with StepIndicator and 3 steps:
      - Step 1: Select doctor (filterable by specialty, cards with name/specialty/rating/next available)
      - Step 2: Select date & time (calendar next 30 days with slot count annotations, time slot list)
      - Step 3: Confirm (SymptomScreeningForm, booking summary, submit button)
    - Preserve wizard state across step navigation (lost only on explicit cancel)
    - Handle concurrent slot booking error: show ErrorState, refresh slots, return to step 2
    - Navigate to My Queue or Dashboard on success
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [x]* 10.3 Write property tests for booking wizard
    - **Property 18: Booking Calendar Bounds**
    - **Property 19: Wizard State Preservation**
    - **Validates: Requirements 17.3, 17.7**

  - [x] 10.4 Rewrite PatientMyQueuePage
    - Rewrite `src/pages/patient/my-queue.tsx` with hero queue card (mono-xl number, doctor, current position, estimated wait, progress visualization using transform+opacity)
    - Display "You are next" notice when position === 1 with non-modal alert
    - Display confirmation message when status transitions to In Consultation
    - EmptyState when no active ticket (actions: Book Appointment / Check-in)
    - Integrate use-realtime-sync for queue_update events (update within 1000ms, aria-live announcement)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 10.5 Rewrite PatientMedicalHistoryPage
    - Rewrite `src/pages/patient/medical-history.tsx` with chronological list (date, doctor, complaint, diagnosis)
    - Implement row click → detail view (full record, read-only)
    - Display rating action on completed visits not yet rated
    - Implement rating modal (StarRating 1-5, optional comment ≤1000 chars)
    - Submit rating to endpoint, update row to show rating recorded
    - Implement PDF export action
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [x]* 10.6 Write property tests for rating eligibility
    - **Property 20: Rating Eligibility**
    - **Validates: Requirements 19.3**

  - [x] 10.7 Rewrite PatientSettingsPage
    - Rewrite `src/pages/patient/settings.tsx` with editable profile fields (name, email, phone, address, emergency contact), immutable fields read-only
    - Implement theme controls bound to ThemeStore: mode (light/dark/high-contrast), font scale (0.875/1/1.125/1.25), reduced motion
    - Implement password change form (current password + new password with complexity validation)
    - Implement account deletion with "DELETE" confirmation
    - Show confirmation toast on profile save (within 500ms)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [x] 11. Checkpoint - Ensure all page rewrites work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Cross-cutting concerns and integration wiring
  - [x] 12.1 Implement API_Client error interceptors
    - Update `src/api/client.ts` with 401 handling (attempt token refresh once, then force sign-out + redirect)
    - Implement 5xx auto-retry (once after 2s delay)
    - Implement duplicate submission prevention pattern (shared utility)
    - Clear TanStack Query cache on auth → unauth transition
    - _Requirements: 26.2, 26.4, 26.6, 27.5, 27.6_

  - [x]* 12.2 Write property tests for API error handling
    - **Property 23: 401 Session Termination**
    - **Property 24: 5xx Auto-Retry**
    - **Property 27: Cache Cleared on Logout**
    - **Validates: Requirements 26.2, 26.4, 27.6**

  - [x] 12.3 Implement route configuration with lazy loading
    - Update `src/App.tsx` route configuration to ensure all existing paths resolve correctly
    - Apply React.lazy to AdminAnalyticsPage, DoctorMedicalRecordsPage, TVDisplayPage
    - Verify all route paths preserved (no broken bookmarks)
    - _Requirements: 24.4, 30.1_

  - [x]* 12.4 Write property tests for route preservation
    - **Property 29: Route Preservation**
    - **Validates: Requirements 30.1**

  - [x] 12.5 Implement accessibility compliance across all pages
    - Ensure all interactive elements have logical tab order and focus-visible ring (2px, 3:1 contrast)
    - Add aria-label to all icon-only buttons
    - Add aria-live regions for queue updates and check-in events
    - Ensure all form inputs have associated labels and aria-describedby for errors
    - Verify reduced-motion is respected everywhere (prefers-reduced-motion + ThemeStore flag)
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8_

  - [x]* 12.6 Write property tests for ARIA completeness
    - **Property 22: ARIA Attribute Completeness**
    - **Validates: Requirements 23.5**

  - [x] 12.7 Implement security hardening
    - Verify JWT storage strategy (sessionStorage default, localStorage with "remember me")
    - Ensure no console logging of JWTs/passwords/patient IDs in production
    - Verify all user-supplied content rendered via React text (no dangerouslySetInnerHTML)
    - Ensure HTTPS enforcement for API requests (except localhost)
    - _Requirements: 27.1, 27.2, 27.3, 27.4_

- [x] 13. Performance optimization
  - [x] 13.1 Implement list windowing for large datasets
    - Add @tanstack/react-virtual for lists exceeding 50 items, or enforce server-side pagination (max 50 DOM nodes)
    - Apply to AdminPatientsPage, AdminAppointmentsPage, DoctorMedicalRecordsPage
    - _Requirements: 24.6_

  - [x] 13.2 Verify CLS prevention and skeleton dimensions
    - Ensure all skeleton placeholders match exact dimensions of loaded content
    - Verify theme switches affect only color/shadow/opacity (never dimensions)
    - Verify StatCard heights are fixed regardless of content length
    - _Requirements: 24.2_

  - [x] 13.3 Configure TanStack Query staleTime/gcTime values
    - Apply staleTime values per data domain: doctors/schedules/patients (5min), dashboard/queue (30s), appointments (1min), analytics/records (5min), ratings (10min)
    - _Requirements: 25.6_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations use TypeScript + React
- Existing components (Button, Card, StatCard, ErrorBoundary, StarRating, SymptomScreeningForm) are reused, not recreated
- All route paths are preserved for backward compatibility (Requirement 30)
- No backend changes required — all API contracts remain unchanged (Requirement 30)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4", "1.8"] },
    { "id": 1, "tasks": ["1.2", "1.6", "1.10", "1.5"] },
    { "id": 2, "tasks": ["1.3", "1.7", "1.9", "2.1", "2.3", "2.4", "2.5", "2.8", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.6", "2.10"] },
    { "id": 4, "tasks": ["2.7", "3.1", "3.2"] },
    { "id": 5, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 6, "tasks": ["3.6", "5.1", "5.3"] },
    { "id": 7, "tasks": ["5.2", "6.1", "6.2"] },
    { "id": 8, "tasks": ["7.1", "7.3", "7.5"] },
    { "id": 9, "tasks": ["7.2", "7.4", "7.6", "7.7"] },
    { "id": 10, "tasks": ["7.8", "7.9", "7.10", "7.12"] },
    { "id": 11, "tasks": ["7.11", "7.13", "9.1"] },
    { "id": 12, "tasks": ["9.2", "9.4"] },
    { "id": 13, "tasks": ["9.3", "9.5", "10.1"] },
    { "id": 14, "tasks": ["10.2", "10.4", "10.5"] },
    { "id": 15, "tasks": ["10.3", "10.6", "10.7"] },
    { "id": 16, "tasks": ["12.1", "12.3", "12.5", "12.7"] },
    { "id": 17, "tasks": ["12.2", "12.4", "12.6", "13.1", "13.2", "13.3"] }
  ]
}
```
