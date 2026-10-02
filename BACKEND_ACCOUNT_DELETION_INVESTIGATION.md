# Backend Account Deletion Investigation

**Target Project:** SchoolBit React Native / Expo Application (`SchoolBitApp`)  
**Audit Date:** September 29, 2026  
**Scope:** Comprehensive Inspection of Backend API Collections & Documentation for Apple App Store Account Deletion Compliance  

---

## 1. Available Backend Evidence

The backend API architecture and endpoint inventory were thoroughly inspected across all available backend reference documents in the workspace:

1. **`API/schoolBit-SMOS-API.postman_collection.json`** — Official Postman Collection containing 669 endpoint specifications across 34 modules.
2. **`API/README.md`** — Official 89KB documentation for the SchoolBit SMOS API (`https://fingerprint-cp.mobile.net.sa/api/smos`).
3. **`docs/official-api-audit.md`** — Technical audit comparing frontend API client calls with official backend definitions.
4. **`src/api/*` and `src/services/*`** — Client-side API request definitions.

---

## 2. Self-Service Account Deletion Endpoint

> **NO VERIFIED SELF-SERVICE ACCOUNT DELETION ENDPOINT FOUND.**

Exhaustive automated and manual inspection of all 669 backend endpoints in `schoolBit-SMOS-API.postman_collection.json` and `API/README.md` confirms:

* **Authentication Module Endpoints:**
  * `POST /login` (Staff Login)
  * `POST /auth/2fa/verify` (2FA Verification)
  * `POST /auth/2fa/resend` (2FA Resend)
  * `POST /auth/forgot-password` (Password Reset Request)
  * `POST /auth/reset-password` (Password Reset Confirm)
  * `POST /logout` (Session Invalidation)
  * `GET /me` (Authenticated User Profile)
  * `GET /access/me` (User Permissions & Roles)
  * `POST /signup` (School Registration)
  * `POST /portal/auth/request-code` (Student/Parent OTP Request)
  * `POST /portal/auth/verify` (Student/Parent OTP Verification)
  * `POST /guardian/auth/request-code` (Guardian Finance OTP Request)
  * `POST /guardian/auth/verify` (Guardian Finance OTP Verification)
  * `POST /platform/auth/login` (Platform Owner Login)

* **Finding:** There is **no endpoint** such as `DELETE /auth/me`, `DELETE /user/account`, `DELETE /account`, `DELETE /profile`, `POST /account/delete-request`, or `/anonymize` that permits an authenticated user (Principal, Vice Principal, Teacher, Counselor, Staff, Student, or Parent) to delete or request deletion of their own account.

---

## 3. Administrative User Deletion Endpoints

The backend documentation defines 56 `DELETE` or removal endpoints, but all user-related deletion endpoints are strictly **administrative management functions** intended for school administrators to manage third-party entities:

### Endpoint Breakdown

1. **`DELETE /sub-users/:subUser`**
   * **HTTP Method:** `DELETE`
   * **Authentication:** Required (`Authorization: Bearer <token>` with `sub_users.delete` or Owner permission).
   * **Parameters:** `subUser` (Path parameter - target sub-user account ID).
   * **Target:** Secondary staff / sub-user accounts managed under a school.
   * **Can authenticated user delete own account?** **No.** Designed for school owners to remove secondary staff accounts.
   * **Apple Compliance Suitability:** **No.** Does not allow self-service initiation by the account owner.
   * **Source:** `API/schoolBit-SMOS-API.postman_collection.json` (Item: "حذف المستخدمين الفرعيين").

2. **`DELETE /employees/:id`**
   * **HTTP Method:** `DELETE`
   * **Authentication:** Required (`Authorization: Bearer <token>` with `employees.delete` or `hr.manage` permission).
   * **Parameters:** `id` (Path parameter - target employee or student record ID).
   * **Target:** School employee or student database record.
   * **Can authenticated user delete own account?** **No.** Requires administrative privileges to delete another employee/student record.
   * **Apple Compliance Suitability:** **No.**
   * **Source:** `API/schoolBit-SMOS-API.postman_collection.json` (Item: "حذف الطلاب والموظفين").

3. **`POST /employees/bulk-delete`**
   * **HTTP Method:** `POST`
   * **Authentication:** Required (`Authorization: Bearer <token>` with administrative permissions).
   * **Parameters:** Array of `employee_ids` in JSON request body.
   * **Target:** Batch removal of employee/student records by school management.
   * **Can authenticated user delete own account?** **No.**
   * **Apple Compliance Suitability:** **No.**
   * **Source:** `API/schoolBit-SMOS-API.postman_collection.json` (Item: "حذف جماعي الطلاب والموظفين").

4. **`DELETE /guardians/:id`**
   * **HTTP Method:** `DELETE`
   * **Authentication:** Required (`Authorization: Bearer <token>` with admin permission).
   * **Parameters:** `id` (Path parameter - target parent/guardian ID).
   * **Target:** Parent/guardian record in school database.
   * **Can authenticated user delete own account?** **No.**
   * **Apple Compliance Suitability:** **No.**
   * **Source:** `API/schoolBit-SMOS-API.postman_collection.json` (Item: "حذف أولياء الأمور").

---

## 4. Deactivation / Soft Delete Endpoints

* **`DELETE /settings/security/sessions/:id`**
  * **Function:** Terminates a specific active JWT session ID.
  * **Behavior:** Invalidates session token, forcing re-login on that device. It does **not** deactivate, anonymize, or delete the user account.
* **`POST /finance/pay-links/:id/cancel`**
  * **Function:** Cancels an active financial payment link.
  * **Behavior:** Domain transaction cancelation; unrelated to user account status.
* **Finding:** No user account deactivation or self-service soft-delete endpoints exist in the documented backend API.

---

## 5. Student/Parent/Staff Deletion Endpoints

| Account Role | Self-Deletion Endpoint Available? | Admin Deletion Endpoint Available? | Source Evidence |
| :--- | :---: | :---: | :--- |
| **School Owner / Principal** | **No** | **No** | None |
| **Vice Principal** | **No** | Yes (`DELETE /sub-users/:subUser` or `DELETE /employees/:id`) | `schoolBit-SMOS-API.postman_collection.json` |
| **Teacher** | **No** | Yes (`DELETE /employees/:id`) | `schoolBit-SMOS-API.postman_collection.json` |
| **Counselor / Staff** | **No** | Yes (`DELETE /employees/:id`) | `schoolBit-SMOS-API.postman_collection.json` |
| **Student** | **No** | Yes (`DELETE /employees/:id`) | `schoolBit-SMOS-API.postman_collection.json` |
| **Parent** | **No** | Yes (`DELETE /guardians/:id`) | `schoolBit-SMOS-API.postman_collection.json` |

> [!IMPORTANT]
> **Crucial Distinction:** Deleting a student, employee, or guardian record via administrative endpoints is an organizational management action by a school admin. It does NOT satisfy Apple App Store Guideline 5.1.1(v), which mandates that any user who creates or logs into an account must be able to initiate deletion of their own account directly.

---

## 6. Data Deletion Behavior

* **Local Mobile Storage:** `logout()` in `src/store/auth.store.ts` purges local authentication tokens (`smos_token`) from `expo-secure-store` and resets in-memory React Query caches.
* **Backend Database Data:** Deleting an employee/student via admin API (`DELETE /employees/:id`) removes or soft-deletes the record on the server. However, historical logs (e.g. past attendance, grade transcripts, financial invoices) may remain in database audit tables due to educational regulatory record-keeping requirements.

---

## 7. Authentication Requirements

All deletion endpoints documented in the Postman collection require:
1. `Authorization: Bearer <token>` header containing a valid staff/admin JWT token.
2. Specific authorization roles/permissions (`is_owner: true` or permission slugs like `employees.delete`, `guardians.delete`).
3. Standard users (Teachers, Students, Parents) do NOT possess administrative permission slugs to execute entity deletion calls.

---

## 8. Apple Account Deletion Compatibility

> [!WARNING]
> **COMPLIANCE ASSESSMENT: NOT COMPLIANT**

* **Apple Guideline 5.1.1(v) Mandate:**  
  *"If your app includes account creation, you must also allow users to initiate deletion of their account within the app."*
* **Root Cause Analysis:**
  1. The app allows account registration (`SignupScreen.tsx` calling `POST /auth/register`).
  2. Neither the mobile app frontend nor the backend API provides a self-service account deletion endpoint or account deletion request link.
  3. Submitting the app to Apple in its current state will trigger an immediate **Guideline 5.1.1(v) rejection**.

---

## 9. Recommended Technical Path

To achieve full Apple App Store submission readiness, the following engineering steps must be taken:

### Step 1: Backend Endpoint Implementation (Recommended)
The backend development team must implement a self-service account deletion or deletion-request endpoint:
* **Proposed Endpoint:** `DELETE /auth/me` or `POST /auth/delete-account-request`
* **Behavior:** Revokes the authenticated user's active session, flags their account status as pending deletion/anonymization, and logs the deletion request for privacy compliance while preserving required regulatory educational archives.

### Step 2: Frontend Integration
* Add a **"Delete Account" / "إلغاء الحساب"** option in `src/screens/main/SettingsScreen.tsx`.
* Trigger a double-confirmation alert warning the user of account deletion.
* Execute `DELETE /auth/me`, purge local secure storage, and redirect to login.

### Step 3: Alternative Path (Web Portal Deletion Link)
If backend API changes cannot be deployed before submission:
* Provide a web URL (e.g. `https://fingerprint-cp.mobile.net.sa/privacy/delete-account`).
* Display an external web link in `SettingsScreen.tsx` that opens this deletion request URL in the native browser (`Linking.openURL`).
* Provide the same URL in the App Store Connect **Privacy Policy URL** field.

---

## 10. VERIFIED

The following technical facts are **VERIFIED** based strictly on the inspected source files and backend API documentation:

1. **Verified:** `API/schoolBit-SMOS-API.postman_collection.json` contains 669 documented endpoints.
2. **Verified:** Zero self-service account deletion endpoints exist in the backend documentation for any user role.
3. **Verified:** Administrative endpoints (`DELETE /employees/:id`, `DELETE /guardians/:id`, `DELETE /sub-users/:subUser`) exist solely for admins to delete third-party records.
4. **Verified:** The mobile app frontend contains account creation (`SignupScreen.tsx`) but no account deletion UI or API integration.
5. **Verified:** The app currently violates Apple App Store Guideline 5.1.1(v).

---

## 11. REQUIRES BACKEND CONFIRMATION

The following items cannot be determined from the codebase alone and require confirmation from backend server developers:

1. **Un-documented Endpoints:** Does an un-documented or newly deployed `DELETE /auth/me` endpoint exist on the live server (`https://fingerprint-cp.mobile.net.sa/api/smos`) that is missing from `schoolBit-SMOS-API.postman_collection.json`?
2. **Web Deletion URL:** Is there an existing web portal page for handling user data/account deletion requests?
3. **Data Anonymization Policy:** Does the backend database hard-delete user records or apply soft-delete flags (`deleted_at`) to retain required educational records?
