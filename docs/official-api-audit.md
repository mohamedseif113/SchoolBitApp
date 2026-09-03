# PHASE 20 — Official API Audit
Generated: 2026-08-29 | Source: schoolBit-SMOS-API.postman_collection.json + README.md

## API Source

| Item | Value |
|------|-------|
| JSON Collection | API/schoolBit-SMOS-API.postman_collection.json |
| README | API/README.md |
| Base URL (App) | https://fingerprint-cp.mobile.net.sa/api/smos |
| Auth Model | Authorization: Bearer token (4 independent token types) |
| Response Envelope | { success: true, data: {} } or { success: true, data: [], meta: { current_page, per_page, has_more } } |
| Error Envelope | { success: false, message: string, errors: { field: [string] } } |
| Required Headers | Accept: application/json + Content-Type: application/json |
| Total Documented Endpoints | 669 across 34 modules |

---

## CRITICAL ENDPOINT MISMATCHES (Breaking - Must Fix First)

### 1. Students — Wrong prefix: /students/* -> /employees/*
- App: GET /students, GET /students/{id}, POST /students, PUT /students/{id}, DELETE /students/{id}
- Official: GET /employees, GET /employees/{id}, POST /employees, PUT /employees/{id}, DELETE /employees/{id}
- Fix: src/api/students.ts

### 2. Schedule — Wrong prefix: /schedules/* -> /schedule/*
- App: GET /schedules, GET /schedules/weekly, GET /schedules/grid, GET /schedules/mine, POST /schedules, POST /schedules/conflicts
- Official: GET /schedule, GET /schedule/weekly, GET /schedule/grid, GET /schedule/mine, POST /schedule, POST /schedule/check-conflicts
- Fix: src/api/schedule.ts

### 3. Student Attendance — Wrong paths: /attendance/* -> /attendance/students/*
- App: GET /attendance/summary, GET /attendance/daily, POST /attendance/daily, GET /attendance/records
- Official: GET /attendance/students/statistics, GET /attendance/students/daily, POST /attendance/students/quick-mark/set-status
- Fix: src/api/attendance.ts

### 4. HR — Wrong prefix: /staff/* and /attendance/leaves/* -> /hr/*
- App: GET /staff, GET /staff/{id}, POST /staff, GET /attendance/leaves, POST /attendance/leaves/request, POST /attendance/leaves/{id}/approve
- Official: GET /employees (filtered), GET /hr/employees/{id}/profile, GET /hr/leaves, POST /hr/leaves, POST /hr/leaves/{id}/decide
- Fix: src/api/hr.ts

### 5. Exam Distribution — Wrong prefix: /exam-distribution/* -> /exams/* + /exam-dist/*
- App: GET /exam-distribution, GET /exam-distribution/sessions, GET /exam-distribution/rooms, POST /exam-distribution/{id}/generate, POST /exam-distribution/{id}/validate (INVENTED)
- Official: GET /exams, GET /exam-dist/sessions, GET /exam-dist/rooms, POST /exam-dist/sessions/{sessionId}/distribute
- Fix: src/api/examDistribution.ts

### 6. Dashboard — Should call /dashboard directly, not /dashboard/overview
- App: Tries GET /dashboard/overview (404 always) then GET /dashboard; also calls GET /dashboard/stats (does not exist)
- Official: GET /dashboard, GET /dashboard/teacher, GET /dashboard/counselor, GET /dashboard/badges
- Fix: src/api/dashboard.ts

### 7. Finance Summary — /finance/summary does not exist
- App: GET /finance/summary
- Official: GET /finance/dashboard
- Fix: src/api/finance.ts + src/hooks/useFinance.ts

### 8. Pay Link Cancel — Wrong method
- App: DELETE /finance/pay-links/{id}
- Official: POST /finance/pay-links/{id}/cancel
- Fix: src/api/finance.ts

### 9. Portfolio — Wrong sub-paths
- App: GET/POST /portfolio/{id}/notes -> should be GET/POST /portfolio/{id}/feedback
- App: POST /portfolio/{id}/remind -> should be POST /portfolio/{id}/reminder
- Fix: src/api/portfolio.ts

### 10. At-Risk Analytics — Wrong path
- App: GET /at-risk/analytics (does not exist)
- Official: GET /at-risk/summary
- Fix: src/api/atRisk.ts

### 11. Integration Webhook path
- App: GET /integrations/{id}/webhooks (plural)
- Official: GET /integrations/{id}/webhook (singular)
- Fix: src/api/integrations.ts

### 12. Homework Grade — Wrong method/path
- App: POST /homework/submissions/{id}/grade
- Official: PUT /homework/{id}/submissions/{submissionId}
- Fix: src/api/homework.ts

---

## Integration Status Per Module

| Module | Implemented | Status | Priority |
|--------|------------|--------|----------|
| 01 Auth | POST /login, /auth/2fa/verify, /auth/2fa/resend, /auth/forgot-password, /auth/reset-password, /logout, GET /me, /access/me, POST /signup | MOSTLY IMPLEMENTED (SSO missing) | LOW |
| 02 Student Portal | OUT OF SCOPE | — | — |
| 03 Guardian Portal | OUT OF SCOPE | — | — |
| 04 Public Routes | OUT OF SCOPE | — | — |
| 05 Subscription | GET /me/subscription, GET /plans, POST /me/billing/bank-transfer | PARTIAL (checkout/confirm/bank-details missing) | MEDIUM |
| 06 Student Attendance | ALL WRONG PATHS | CRITICAL MISMATCH | CRITICAL |
| 07 Teacher Attendance | NOT IMPLEMENTED | MISSING | HIGH |
| 08 Fingerprint Devices | NOT IMPLEMENTED | MISSING | LOW |
| 09 PDF/Excel Reports | NOT IMPLEMENTED | MISSING | MEDIUM |
| 10 Students/Employees | CRITICAL PATH MISMATCH /students vs /employees | CRITICAL MISMATCH | CRITICAL |
| 11 Classes/Groups | NOT IMPLEMENTED | MISSING | HIGH |
| 12 Roles/Permissions | GET /access/me only | PARTIAL | MEDIUM |
| 13 Dashboard | Wrong endpoints, double request | PARTIAL/MISMATCH | HIGH |
| 14 Behavior | ALL 11 endpoints correct | FULLY IMPLEMENTED | — |
| 15 Tasks | ALL 9 endpoints correct | FULLY IMPLEMENTED | — |
| 16 Messages+WhatsApp | 21/34 endpoints correct | MOSTLY IMPLEMENTED | MEDIUM |
| 17 Notifications | GET /notifications only | PARTIAL | MEDIUM |
| 18 Summons | 8/9 endpoints correct | MOSTLY IMPLEMENTED | LOW |
| 19 Settings | UI SHELL ONLY | MISSING | HIGH |
| 20 Schedule | ALL WRONG PATHS /schedules vs /schedule | CRITICAL MISMATCH | CRITICAL |
| 21 Academic Structure | NOT IMPLEMENTED | MISSING | HIGH |
| 22 Committees | 14/21 endpoints correct | MOSTLY IMPLEMENTED | LOW |
| 23 Reports | ALL 11 endpoints correct | FULLY IMPLEMENTED | — |
| 24 Forms/Surveys | NOT IMPLEMENTED | MISSING | MEDIUM |
| 25 Portfolio | Wrong notes/feedback/remind paths | PARTIAL MISMATCH | MEDIUM |
| 26 Exam Distribution | ALL WRONG PATHS | CRITICAL MISMATCH | CRITICAL |
| 27 At-Risk | Wrong analytics path | PARTIAL MISMATCH | MEDIUM |
| 28 Integrations+Noor | Several invented endpoints | PARTIAL MISMATCH | MEDIUM |
| 29 HR | ALL WRONG PATHS /staff vs /hr/* | CRITICAL MISMATCH | CRITICAL |
| 30 Homework | Grade endpoint wrong method/path | MOSTLY IMPLEMENTED | MEDIUM |
| 31 Finance | /finance/summary does not exist | PARTIAL MISMATCH | HIGH |
| 32 Audit Log | NOT IMPLEMENTED | MISSING | LOW |
| 33 Attachments | NOT IMPLEMENTED | MISSING | LOW |
| 34 Platform Owner | OUT OF SCOPE | — | — |

---

## Mock / Hardcoded Business Data Findings (MUST FIX)

| File | Line | Issue | Severity |
|------|------|-------|----------|
| AttendanceScreen.tsx | 22-28 | FALLBACK_CLASSES constant with fake Arabic class names | CRITICAL |
| AttendanceScreen.tsx | 30-36 | FALLBACK_STUDENTS with fake student names and IDs | CRITICAL |
| AttendanceScreen.tsx | 63 | Displays FALLBACK_CLASSES when API returns 0 classes | CRITICAL |
| AttendanceScreen.tsx | 65 | ?? 96.2 (fake attendance rate fallback) | CRITICAL |
| AttendanceScreen.tsx | 66 | ?? 115 (fake present count fallback) | CRITICAL |
| AttendanceScreen.tsx | 67 | ?? 5 (fake absent count fallback) | CRITICAL |
| AttendanceScreen.tsx | 68 | ?? 2 (fake late count fallback) | CRITICAL |
| AttendanceScreen.tsx | 84 | Displays FALLBACK_STUDENTS when class has no records | CRITICAL |
| FinanceScreen.tsx | 35-39 | FALLBACK_INVOICES with fake names and amounts | CRITICAL |
| FinanceScreen.tsx | 75 | Displays FALLBACK_INVOICES when API returns empty | CRITICAL |
| FinanceScreen.tsx | 176 | ?? 10500 (fake paid amount KPI) | CRITICAL |
| FinanceScreen.tsx | 180 | ?? 3500 (fake pending amount KPI) | CRITICAL |
| FinanceScreen.tsx | 184 | ?? 3500 (fake overdue amount KPI) | CRITICAL |
| DashboardScreen.tsx | 74-102 | Hardcoded unreadNotifications array (3 fake items) | CRITICAL |
| DashboardScreen.tsx | 105-146 | Hardcoded tasks state (5 fake tasks) | CRITICAL |
| DashboardScreen.tsx | 149-177 | Hardcoded timetableItems (3 fake schedule items) | CRITICAL |
| DashboardScreen.tsx | 427 | ?? '1,240' (fake total students fallback) | HIGH |
| DashboardScreen.tsx | 448 | ?? '85' (fake total staff fallback) | HIGH |
| DashboardScreen.tsx | 469 | ?? 96 (fake attendance rate fallback) | HIGH |
| DashboardScreen.tsx | 487 | ?? 3 (fake urgent tasks fallback) | HIGH |
| BehaviorScreen.tsx | 210 | ?? 14 (fake total incidents fallback) | HIGH |
| BehaviorScreen.tsx | 214 | ?? 5 (fake open count fallback) | HIGH |
| BehaviorScreen.tsx | 218 | ?? 9 (fake closed count fallback) | HIGH |
| MessagesScreen.tsx | 161 | ?? 2450 (fake SMS balance fallback) | HIGH |
| NoorIntegrationScreen.tsx | 94 | ?? 1450 (fake synced students fallback) | HIGH |
| NoorIntegrationScreen.tsx | 98 | ?? 85 (fake synced staff fallback) | HIGH |
| auth.store.ts | 129-133 | Fallback user { id: 1, name: 'User' } | MEDIUM |
| auth.store.ts | 240 | Fallback user { id: 1, name: 'User', email: '' } | MEDIUM |

Rule: All ?? <number> and ?? '<string>' fallbacks for business data must be replaced with:
- Numeric: field != null ? field : '—'
- Arabic: field != null ? field : 'غير متوفر'
- Never show made-up business numbers.

---

## Permission Slug Mismatches (PermissionGuard)

| Module | App Uses | Official Slug | Action |
|--------|----------|---------------|--------|
| Finance | finance.view | finance.reports.view | Fix to finance.reports.view |
| Homework | homework.view | homework.assignment.view | Fix to homework.assignment.view |
| HR | hr.view | hr.employee.profile.view | Fix to hr.employee.profile.view |
| Noor | noor.view | settings.manage | Fix to settings.manage |
| WhatsApp | whatsapp.manage | messages.send | Fix to messages.send |
| Integrations | integrations.manage | NONE (no permission required) | Remove guard |

---

## Authentication Audit

| Item | Status |
|------|--------|
| Token Storage | CORRECT — expo-secure-store (Keychain/Keystore) |
| Bearer Token Header | CORRECT — injected via Axios interceptor |
| Accept: application/json | CORRECT — set as default |
| 401 Handling | CORRECT — clears token, calls clearAuth() |
| 402 Handling | MISSING — must NOT clear token on 402, show subscription screen |
| 403 Handling | PARTIAL — no specific UI action |
| 422 Handling | CORRECT — extracts field-level errors |
| 429 Handling | MISSING — no rate-limit message |
| locked field from login | STORED in authStore |
| locked_message field | NOT STORED |
| 2FA verify | CORRECT — POST /auth/2fa/verify |
| 2FA resend | CORRECT — POST /auth/2fa/resend |
| Logout | CORRECT — POST /logout + token cleared |
| AsyncStorage | NOT USED — correctly using SecureStore only |

---

## API Client Audit

| Item | Status |
|------|--------|
| Base URL | CORRECT — from EXPO_PUBLIC_API_URL |
| Timeout | CORRECT — 15000ms |
| Accept/Content-Type headers | CORRECT |
| Authorization injection | CORRECT — async interceptor |
| 401 handler | CORRECT |
| 402 handler | MISSING — critical per official docs |
| 422 handler | CORRECT |
| Centralized error | CORRECT — ApiError class |
| Network/timeout messages | CORRECT — Arabic |
| Duplicate Axios instances | NONE — all import from client.ts |

---

## Navigation Audit

| Route | Permission Used | Official Slug | Status |
|-------|----------------|---------------|--------|
| Dashboard (Tab) | None | — | OK |
| Students (Tab) | None | employees.view | No guard — acceptable for tab |
| Attendance (Tab) | None | attendance.students.view | No guard |
| Tasks (Tab) | None | tasks.view | OK |
| Schedule (Stack) | schedule.view | schedule.view | OK |
| Messages (Stack) | messages.view | messages.view | OK |
| Reports (Stack) | reports.view | reports.view | OK |
| Finance (Stack) | finance.view | finance.reports.view | WRONG SLUG |
| Settings (Stack) | None | — | OK |
| Behavior (Stack) | behavior.view | behavior.view | OK |
| Summons (Stack) | summons.view | summons.view | OK |
| Committees (Stack) | committees.view | committees.view | OK |
| Homework (Stack) | homework.view | homework.assignment.view | WRONG SLUG |
| HR (Stack) | hr.view | hr.employee.profile.view | WRONG SLUG |
| Portfolio (Stack) | portfolio.view | portfolio.view | OK |
| ExamDistribution (Stack) | exams.view | exams.view | OK |
| AtRisk (Stack) | at_risk.view | at_risk.view | OK |
| Noor (Stack) | noor.view | settings.manage | WRONG SLUG |
| NoorIntegration (Stack) | noor.view | — | DUPLICATE ROUTE |
| Integrations (Stack) | integrations.manage | NONE REQUIRED | INVENTED PERM |
| WhatsApp (Stack) | whatsapp.manage | messages.send | WRONG SLUG |

---

## Recommended Fix Order

### Priority 1 — Auth & Security
1. Add 402 handler in client.ts: do NOT clear token, navigate to subscription screen
2. Store locked_message from login response in auth.store.ts

### Priority 2 — Critical API Path Fixes
3. Fix schedule.ts: /schedules/* -> /schedule/*, /schedules/conflicts -> /schedule/check-conflicts
4. Fix students.ts: /students/* -> /employees/*
5. Fix hr.ts: /staff/* -> /employees/*, /attendance/leaves/* -> /hr/leaves/*, /reports/staff-attendance -> /hr/attendance
6. Fix examDistribution.ts: /exam-distribution -> /exams and /exam-dist
7. Fix dashboard.ts: call /dashboard directly, add /dashboard/teacher, /dashboard/counselor, /dashboard/badges
8. Fix finance.ts: /finance/summary -> /finance/dashboard, DELETE pay-link -> POST /cancel
9. Fix portfolio.ts: /notes -> /feedback, /remind -> /reminder
10. Fix attendance.ts: /attendance/summary -> /attendance/students/statistics, /attendance/daily -> /attendance/students/daily
11. Fix atRisk.ts: /at-risk/analytics -> /at-risk/summary
12. Fix integrations.ts: /integrations/{id}/webhooks -> /integrations/{id}/webhook (singular)
13. Fix homework.ts: grade endpoint method and path

### Priority 3 — Permission Slug Fixes in AppNavigator
14. finance.view -> finance.reports.view
15. homework.view -> homework.assignment.view
16. hr.view -> hr.employee.profile.view
17. noor.view -> settings.manage
18. whatsapp.manage -> messages.send
19. Remove integrations.manage guard (no permission required)
20. Remove duplicate NoorIntegration route

### Priority 4 — Mock Data Removal
21. AttendanceScreen: Remove FALLBACK_CLASSES, FALLBACK_STUDENTS, all numeric ?? fallbacks
22. FinanceScreen: Remove FALLBACK_INVOICES, replace ?? numbers with '—'
23. DashboardScreen: Replace hardcoded notifications/tasks/timetable arrays with API data
24. DashboardScreen: Replace ?? numeric fallbacks with '—'
25. BehaviorScreen: Replace ?? numeric fallbacks with '—'
26. MessagesScreen: Replace ?? 2450 with '—'
27. NoorIntegrationScreen: Replace ?? 1450, ?? 85 with '—'

### Priority 5 — Missing Features
28. Add GET /notifications/unread-count + POST /notifications/{id}/read
29. Add GET /dashboard/badges for badge counts
30. Add GET /summons/stats to SummonsScreen
31. Implement GET/PUT /settings/profile in SettingsScreen
32. Add GET /groups / GET /sub-groups for class filtering

---

## Final Report

### API Documentation
- Official JSON: FOUND
- Official README: FOUND
- Base URL: https://fingerprint-cp.mobile.net.sa/api/smos
- Auth: Bearer token — staff portal only

### API Coverage (approximate)
- Total documented: 669 endpoints
- Correctly implemented: ~95 (14%)
- Partially implemented: ~30 (4%)
- Missing: ~500 (75%)
- Mismatched (wrong paths/methods): ~50 (7%)
- Invented (not in official docs): ~8

### Mock Business Data
- Hardcoded fallback arrays: 3 (FALLBACK_CLASSES, FALLBACK_STUDENTS, FALLBACK_INVOICES)
- Numeric ?? business data fallbacks: 13
- Hardcoded local state (notifications/tasks/timetable): 3 arrays in DashboardScreen
- Fake user object fallbacks: 2 in auth.store.ts

### Authentication
- Secure Storage: CORRECT (expo-secure-store)
- Bearer Token: CORRECT
- 401 Handling: CORRECT
- 402 Handling: MISSING (CRITICAL)
- 2FA: CORRECT
- Logout: CORRECT

### Quality Gates
- TypeScript (npx tsc --noEmit): EXIT CODE 0 — 0 errors
- Expo Doctor: NOT RUN
- Metro: NOT RUN

### Overall Status
NOT PRODUCTION READY.

Critical issues:
1. Six modules have completely wrong API endpoint paths (schedule, students, attendance, HR, exam distribution, finance)
2. 402 subscription lock handling is absent — token incorrectly invalidated or ignored
3. Significant hardcoded/fake business data remains in 5 screens
4. Five PermissionGuard slugs use invented permissions not matching the official backend
5. Dashboard makes a wasteful double-request to a non-existent endpoint every load

The app currently shows fake attendance statistics (96.2%, 115 students), fake financial data (10,500 SAR), fake tasks, fake class lists, and fake notifications to the user when the API returns no data — this violates the official backend contract requirement.
