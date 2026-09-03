# API Discrepancies & Backend Notes

This document records any discrepancies or schema observations between expected API endpoints and actual backend behavior for the SchoolBit React Native application.

## Endpoints Verified / Configured

### 1. `POST /login`
- **Expected Request**: `{ email: string, password?: string }`
- **Expected Response (Success without 2FA)**: `{ token: string, user: User, school?: School, role?: string }`
- **Expected Response (Success with 2FA)**: `{ requires_2fa: true, session_id: string, phone_masked?: string }`
- **Expected Error (401/422)**: `{ message: string, errors?: Record<string, string[]> }`

### 2. `POST /auth/2fa/verify`
- **Expected Request**: `{ session_id: string, code: string }`
- **Expected Response**: `{ token: string, user: User, school?: School }`

### 3. `POST /auth/2fa/resend`
- **Expected Request**: `{ session_id: string }`
- **Expected Response**: `{ success: boolean, message?: string, phone_masked?: string }`

### 4. `POST /auth/forgot-password`
- **Expected Request**: `{ email: string }`
- **Expected Response**: `{ success: boolean, message?: string, phone?: string }`

### 5. `POST /auth/reset-password`
- **Expected Request**: `{ email: string, code: string, password: string, password_confirmation: string }`
- **Expected Response**: `{ success: boolean, message?: string }`

### 6. `POST /logout`
- **Expected Header**: `Authorization: Bearer <token>`
- **Expected Response**: `{ success: boolean, message?: string }`

### 7. `GET /me` & `GET /access/me`
- **Expected Header**: `Authorization: Bearer <token>`
- **Expected Response**: Profile object and permissions map (`permissions: string[]`, `modules: Record<string, boolean>`).

### 8. Phase 4 Dashboard Integration (`GET /dashboard/overview`, `GET /schedules/mine`, `GET /attendance/summary`, `GET /tasks`)
- **Primary Endpoint**: `GET /dashboard/overview` or `GET /dashboard`.
- **Fallback Parallel Endpoints**: If unified overview is unavailable, application falls back seamlessly to querying `/schools/statistics`, `/attendance/summary`, `/schedules/mine`, `/tasks`, and `/notifications`.
- **Expected Data**: `{ stats: { total_students, total_staff, attendance_rate, pending_tasks_count }, attendance: { present_percentage, late_percentage, absent_percentage }, timetable: [...], tasks: [...], notifications: [...] }`.

### 9. Phase 5 Students Integration (`GET /students`, `GET /students/:id`, `POST /students`)
- **List Endpoint**: `GET /students?search=...&page=1&per_page=15`
- **Detail Endpoint**: `GET /students/:id`
- **Create Endpoint**: `POST /students` with payload `{ name, national_id, grade_name, guardian_phone }`
- **Response Structure**: Array of `Student` objects or paginated envelope `{ data: Student[], current_page, last_page, total }`.

### 10. Phase 6 Attendance Integration (`GET /attendance/summary`, `GET /attendance/daily`, `POST /attendance/daily`)
- **Summary Endpoint**: `GET /attendance/summary?date=YYYY-MM-DD`
- **Daily Classes Endpoint**: `GET /attendance/daily?date=YYYY-MM-DD`
- **Batch Save Endpoint**: `POST /attendance/daily` with payload `{ class_id, date: "YYYY-MM-DD", records: [{ student_id, status: "present"|"absent"|"late" }] }`.

### 11. Phase 7 Schedule Integration (`GET /schedules`, `GET /schedules/weekly`, `GET /schedules/grid`, `GET /schedules/mine`, `POST /schedules/conflicts`)
- **Daily Schedule Endpoint**: `GET /schedules?date=YYYY-MM-DD`
- **Weekly Schedule Endpoint**: `GET /schedules/weekly?date=YYYY-MM-DD`
- **Grid Schedule Endpoint**: `GET /schedules/grid?date=YYYY-MM-DD`
- **My Schedule Endpoint**: `GET /schedules/mine?date=YYYY-MM-DD`
- **Create Slot Endpoint**: `POST /schedules` with payload `{ subject_name, teacher_name, class_name, room_name, period, day, start_time, end_time }`
- **Update Slot Endpoint**: `PUT /schedules/:id`
- **Delete Slot Endpoint**: `DELETE /schedules/:id`
- **Conflict Check Endpoint**: `POST /schedules/conflicts` with payload `{ day, period, exclude_id? }` returning `{ has_conflict: boolean, message?: string }`.

### 12. Phase 8 Tasks Integration (`GET /tasks`, `GET /tasks/kanban`, `POST /tasks/:id/toggle`, `GET /tasks/:id/comments`)
- **Tasks List Endpoint**: `GET /tasks?status=...&search=...`
- **Kanban Board Endpoint**: `GET /tasks/kanban`
- **Task Detail Endpoint**: `GET /tasks/:id`
- **Task Toggle Endpoint**: `POST /tasks/:id/toggle`
- **Task Comments Endpoints**: `GET /tasks/:id/comments` & `POST /tasks/:id/comments` with `{ content: string }`.
- **Signup i18n Audit**: All `signup.*` and `auth.*` translation keys resolved in `ar.ts` and `en.ts` (0 raw key strings).

### 13. Phase 9 Messaging Integration (`GET /messages`, `POST /messages/send`, `GET /messages/balance`, `POST /messages/resolve`, `GET/POST /messages/drafts`, `GET/POST /messages/scheduled`, `GET/POST /messages/templates`)
- **Messages Inbox Endpoint**: `GET /messages`
- **Send Message Endpoint**: `POST /messages/send` with `{ title, content, recipient_type, channels }`
- **Balance Check Endpoint**: `GET /messages/balance` returning `{ balance, currency, sms_count, whatsapp_count }`
- **Recipient Resolution Endpoint**: `POST /messages/resolve` with `{ recipient_type }` returning `{ total, valid_count, invalid_count }`
- **Drafts Endpoints**: `GET/POST/PUT/DELETE /messages/drafts`
- **Scheduled Messages Endpoints**: `GET/POST/DELETE /messages/scheduled`
- **Templates Endpoints**: `GET/POST/PUT/DELETE /messages/templates`

### 14. Phase 10 Reports Integration (`GET /reports/templates`, `POST /reports/generate`, `GET /reports/history`, `GET /reports/:id/download`, `GET/POST/DELETE /reports/scheduled`)
- **Templates Endpoint**: `GET /reports/templates`
- **Generate Report Endpoint**: `POST /reports/generate` with `{ template_id, format: "pdf"|"xlsx"|"csv", date_from, date_to }`
- **Report History Endpoint**: `GET /reports/history`
- **Download Report Endpoint**: `GET /reports/:id/download` returning download URL safely via Bearer authentication
- **Scheduled Reports Endpoints**: `GET/POST/PUT/DELETE /reports/scheduled`

### 15. Phase 11 Finance & Payments Integration (`GET /finance/summary`, `GET /finance/invoices`, `GET/POST/DELETE /finance/pay-links`, `GET /finance/gateways`, `GET /me/subscription`, `GET /plans`, `POST /me/billing/bank-transfer`)
- **Summary Endpoint**: `GET /finance/summary` returning `{ paid_amount, pending_amount, overdue_amount, currency }`
- **Invoices List Endpoint**: `GET /finance/invoices`
- **Pay Links Endpoints**: `GET/POST/DELETE /finance/pay-links`
- **Payment Gateways Endpoint**: `GET /finance/gateways`
- **Subscription Endpoint**: `GET /me/subscription`
- **Plans Endpoint**: `GET /plans`
- **Bank Transfer Endpoint**: `POST /me/billing/bank-transfer` with `{ bank_name, account_name, amount, reference_number }`

### 16. Phase 12 Behavior Integration (`GET/POST/PUT/DELETE /behavior/incidents`, `POST /behavior/incidents/:id/close`, `GET/POST/PUT/DELETE /behavior/rules`, `GET /behavior/analytics`)
- **Incidents Endpoints**: `GET/POST/PUT/DELETE /behavior/incidents`
- **Close Incident Endpoint**: `POST /behavior/incidents/:id/close` with `{ resolution_notes, action_taken }`
- **Rules Catalog Endpoints**: `GET/POST/PUT/DELETE /behavior/rules`
- **Analytics Endpoint**: `GET /behavior/analytics` returning `{ total_incidents, open_count, closed_count }`

### 17. Phase 12 Summons Integration (`GET/POST/PUT/DELETE /summons`, `POST /summons/:id/complete`, `POST /summons/:id/cancel`, `POST /summons/:id/no-show`)
- **Summons List & CRUD Endpoints**: `GET/POST/PUT/DELETE /summons`
- **Status Mutation Endpoints**: `POST /summons/:id/complete`, `POST /summons/:id/cancel`, `POST /summons/:id/no-show`

### 18. Phase 12 Committees Integration (`GET/POST/PUT/DELETE /committees`, `/committees/:id/members`, `/committees/:id/tasks`, `/committees/:id/meetings`, `/committees/:id/files`)
- **Committees List & CRUD Endpoints**: `GET/POST/PUT/DELETE /committees`
- **Committee Members Endpoints**: `GET/POST/DELETE /committees/:id/members`
- **Committee Tasks Endpoints**: `GET/POST/PUT/DELETE /committees/:id/tasks`
- **Committee Meetings Endpoints**: `GET/POST/PUT/DELETE /committees/:id/meetings`
- **Committee Files Endpoints**: `GET/POST/DELETE /committees/:id/files`

### 19. Phase 13 Homework Integration (`GET/POST/PUT/DELETE /homework`, `/homework/:id/submissions`, `/homework/submissions/:id/grade`)
- **Homework List & CRUD Endpoints**: `GET/POST/PUT/DELETE /homework`
- **Submissions Endpoint**: `GET /homework/:id/submissions`
- **Grade Submission Endpoint**: `POST /homework/submissions/:id/grade` with `{ grade, feedback }`

### 20. Phase 13 HR Integration (`GET/POST/PUT/DELETE /staff`, `/reports/staff-attendance`, `/attendance/leaves`, `/attendance/leaves/:id/approve`)
- **Employees / Staff Endpoints**: `GET/POST/PUT/DELETE /staff`
- **Staff Attendance Endpoint**: `GET /reports/staff-attendance`
- **Leave Requests Endpoints**: `GET/POST /attendance/leaves` & `POST /attendance/leaves/request`
- **Approve / Reject Leave Endpoints**: `POST /attendance/leaves/:id/approve` & `POST /attendance/leaves/:id/reject`

### 21. Phase 14 Portfolio Integration (`GET/POST/PUT/DELETE /portfolio`, `/portfolio/:id/documents`, `/portfolio/:id/notes`, `/portfolio/:id/approve`, `/portfolio/:id/remind`)
- **Portfolio Endpoints**: `GET/POST/PUT/DELETE /portfolio`
- **Documents Endpoints**: `GET/POST/DELETE /portfolio/:id/documents`
- **Notes Endpoints**: `GET/POST /portfolio/:id/notes`
- **Approve & Remind Endpoints**: `POST /portfolio/:id/approve` & `POST /portfolio/:id/remind`

### 22. Phase 15 Exam Distribution Integration (`GET/POST/PUT/DELETE /exam-distribution`, `/exam-distribution/sessions`, `/exam-distribution/rooms`, `/exam-distribution/:id/seats`, `/exam-distribution/:id/generate`)
- **Exam Distribution Endpoints**: `GET/POST/PUT/DELETE /exam-distribution`
- **Sessions & Rooms Endpoints**: `GET/POST /exam-distribution/sessions` & `GET/POST /exam-distribution/rooms`
- **Seats & Generation Endpoints**: `GET /exam-distribution/:id/seats` & `POST /exam-distribution/:id/generate`

### 23. Phase 15 At-Risk Students Integration (`GET /at-risk`, `GET /at-risk/analytics`, `GET/POST /at-risk/:id/interventions`)
- **At-Risk Students Endpoints**: `GET /at-risk` & `GET /at-risk/analytics`
- **Interventions Endpoints**: `GET/POST /at-risk/:id/interventions`

### 24. Phase 16 Noor Integration (`GET /noor/status`, `POST /noor/sync`)
- **Status Endpoint**: `GET /noor/status`
- **Sync Endpoint**: `POST /noor/sync`

### 25. Phase 16 External Integrations (`GET/POST /integrations`, `POST /integrations/:id/connect`, `POST /integrations/:id/disconnect`, `GET/POST /integrations/:id/webhooks`, `GET /integrations/:id/logs`)
- **Integrations Endpoints**: `GET/POST /integrations`
- **Connect & Disconnect Endpoints**: `POST /integrations/:id/connect` & `POST /integrations/:id/disconnect`
- **Webhooks & Logs Endpoints**: `GET/POST /integrations/:id/webhooks` & `GET /integrations/:id/logs`

### 26. Phase 16 WhatsApp Integration (`GET /me/whatsapp/status`, `POST /me/whatsapp/connect`, `POST /me/whatsapp/disconnect`, `GET /me/whatsapp/qr`, `POST /me/whatsapp/test`)
- **WhatsApp Status Endpoint**: `GET /me/whatsapp/status`
- **Connect & Disconnect Endpoints**: `POST /me/whatsapp/connect` & `POST /me/whatsapp/disconnect`
- **QR & Test Message Endpoints**: `GET /me/whatsapp/qr` & `POST /me/whatsapp/test`









