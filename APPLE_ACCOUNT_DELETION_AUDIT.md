# Apple Account Deletion Audit

**Target Project:** SchoolBit React Native / Expo Application (`SchoolBitApp`)  
**Audit Date:** September 29, 2026  
**Scope:** iOS App Store Guideline 5.1.1(v) Account Deletion Compliance Verification  

---

## 1. Verified Account Creation Flows

Based strictly on source code inspection of `src/screens/auth/SignupScreen.tsx`, `src/screens/auth/LoginScreen.tsx`, `src/api/auth.ts`, and `src/api/portal.ts`:

* **In-App Self-Registration (School Representative / Principal):**
  * **Flow:** Accessible from `LoginScreen.tsx` -> `SignupScreen.tsx`.
  * **Implementation:** The form collects school name, representative name, official email, phone number, password, school stages, and attached license image.
  * **API Endpoint:** Calls `register()` in `src/api/auth.ts` which posts multipart data to `POST /auth/register`.
* **Phone-Based Portal Authentication (Student / Parent):**
  * **Flow:** Accessible from `LoginScreen.tsx` (Portal Tab) -> `TwoFaScreen.tsx`.
  * **Implementation:** Users enter their pre-registered phone number to request an OTP verification code.
  * **API Endpoints:** Calls `requestPortalCode()` (`POST /portal/auth/send-code`) and `verifyPortalCode()` (`POST /portal/auth/verify-code`) in `src/api/portal.ts`.
  * **Note:** Accounts are NOT created dynamically by the user inside the app; the phone number must already exist in the school's backend database.
* **Administrative Provisioning (Teacher / Vice Principal / Counselor / Staff):**
  * **Flow:** Cannot self-register inside the mobile app.
  * **Implementation:** Staff credentials are created out-of-band by school administrators via admin management tools or backend imports.

---

## 2. Verified Account Types

| Role / Account Type | Self-Registration In-App? | Authentication Method | Code Evidence |
| :--- | :---: | :--- | :--- |
| **School Owner / Principal** | **YES** | Email & Password (`POST /auth/login`) or Signup (`POST /auth/register`) | [SignupScreen.tsx:L83-100](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/SignupScreen.tsx#L83-L100)<br/>[auth.ts:L1-20](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/auth.ts#L1-L20) |
| **Vice Principal** | No (Administrative) | Email & Password (`POST /auth/login`) | [LoginScreen.tsx:L90-130](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/LoginScreen.tsx#L90-L130) |
| **Teacher** | No (Administrative) | Email & Password (`POST /auth/login`) | [LoginScreen.tsx:L90-130](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/LoginScreen.tsx#L90-L130) |
| **Student Counselor** | No (Administrative) | Email & Password (`POST /auth/login`) | [LoginScreen.tsx:L90-130](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/LoginScreen.tsx#L90-L130) |
| **Staff / Employee** | No (Administrative) | Email & Password (`POST /auth/login`) | [LoginScreen.tsx:L90-130](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/LoginScreen.tsx#L90-L130) |
| **Student** | No (Pre-registered) | Phone OTP (`POST /portal/auth/verify-code`) | [portal.ts:L1-40](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/portal.ts#L1-L40)<br/>[TwoFaScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/TwoFaScreen.tsx) |
| **Parent** | No (Pre-registered) | Phone OTP (`POST /portal/auth/verify-code`) | [portal.ts:L1-40](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/portal.ts#L1-L40)<br/>[TwoFaScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/TwoFaScreen.tsx) |

---

## 3. Existing In-App Deletion Functionality

* **In-App Account Deletion UI:** **NON-EXISTENT.**
  * Inspection of `SettingsScreen.tsx` ([src/screens/main/SettingsScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/main/SettingsScreen.tsx)) reveals only:
    1. User profile card (displaying name, email, school, role badge).
    2. Preferences section (Dark Mode toggle switch).
    3. Logout button (`handleLogout()`).
  * No "Delete Account", "Close Account", or "Request Account Removal" button or modal exists anywhere in the frontend screen hierarchy.

---

## 4. Backend/API Deletion Capability

* **Account Self-Deletion API Endpoint:** **NON-EXISTENT IN FRONTEND API MODULES.**
  * Exhaustive search across `src/api/` and `src/services/` shows that no API call exists for deleting the authenticated user's own account (e.g. `DELETE /auth/me`, `DELETE /user/account`, or `POST /account/delete-request`).
* **Entity Deletion Endpoints Present in API:**
  * `deleteEmployee(id)` -> `DELETE /employees/{id}` ([hr.ts:L33](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/hr.ts#L33))
  * `deleteStudent(id)` -> `DELETE /employees/{id}` ([students.ts:L42](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/students.ts#L42))
  * `deleteTask(id)` -> `DELETE /tasks/{id}` ([tasks.ts:L36](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/tasks.ts#L36))
  * `deleteSummons(id)` -> `DELETE /summons/{id}` ([summons.ts:L30](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/summons.ts#L30))
  * `deleteHomework(id)` -> `DELETE /homework/{id}` ([homework.ts:L31](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/homework.ts#L31))
  * `deleteIncident(id)` -> `DELETE /behavior/incidents/{id}` ([behavior.ts:L41](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/behavior.ts#L41))
  * `deleteCommittee(id)` -> `DELETE /committees/{id}` ([committees.ts:L32](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/committees.ts#L32))
  * `deletePortfolio(id)` -> `DELETE /portfolio/{id}` ([portfolio.ts:L30](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/portfolio.ts#L30))
  * `deletePayLink(id)` -> `DELETE /finance/pay-links/{id}` ([finance.ts:L77](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/finance.ts#L77))

---

## 5. Deactivation / Data Removal Capability

* **User Deactivation:** No endpoint or toggle exists in the mobile app for deactivating an account.
* **School Deletion:** No endpoint exists for deleting a registered school entity from the app.
* **Administrative Data Removal:** School administrators can delete employee records via `DELETE /employees/{id}` or student records via `DELETE /employees/{id}` (note endpoint mapping in `students.ts`), but these are manager actions, not user self-deletion.

---

## 6. Web-Based Deletion Request

* **In-App Web Link:** **NON-EXISTENT.**
  * There are no external web links, help desk links, or privacy URLs configured in `SettingsScreen.tsx`, `App.tsx`, or translation files ([ar.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/i18n/ar.ts), [en.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/i18n/en.ts)) that direct users to an external web page to request account deletion.
* **External Web Portal Existence:** Cannot be determined from frontend code alone. Requires verification from the backend/web team.

---

## 7. Data Retention Findings

* **Local Device State:** When a user logs out (`logout()`), local storage tokens (`smos_token`) are deleted from `expo-secure-store` via `removeToken()`, and React Query cache is cleared (`queryClient.clear()`).
* **Backend Database Retention:** Personal data (Name, Email, Phone, National ID, Attendance Logs, Behavioral Incidents) remains stored in the remote backend database (`https://fingerprint-cp.mobile.net.sa/api/smos`).
* **Educational Record Compliance:** In institutional school software, academic records (attendance, grades, discipline notes) are often governed by educational regulatory retention mandates. However, account credential deletion or anonymization must still be provided according to Apple guidelines.

---

## 8. Apple Compliance Assessment

> [!WARNING]
> **COMPLIANCE STATUS: NON-COMPLIANT WITH APPLE GUIDELINE 5.1.1(v)**

* **Apple Requirement (Guideline 5.1.1(v)):**  
  *"If your app includes account creation, you must also allow users to initiate deletion of their account within the app."*
* **Evaluation:**  
  1. The app includes account creation (`SignupScreen.tsx` for school representatives).
  2. The app DOES NOT allow users to initiate account deletion within the app.
  3. The app DOES NOT provide a link to a web page where account deletion can be initiated.
* **Risk:** Submitting the application to Apple App Store in its current state will result in a **Rejection under Guideline 5.1.1(v) - Data Collection and Storage (Account Deletion)** during manual App Store review.

---

## 9. Required Implementation

To achieve full compliance with Apple App Store guidelines prior to submission, one of the following two options MUST be implemented:

### Option A: In-App Account Deletion Flow (Recommended)
1. **Backend Endpoint:** Implement `DELETE /auth/me` or `POST /auth/delete-account-request` on the backend server.
2. **Frontend UI:** Add a "Delete Account" / "إلغاء الحساب" button in `SettingsScreen.tsx` with a confirmation modal warning the user about account deletion.
3. **API Integration:** Call the deletion endpoint, clear local secure storage, and navigate the user to the login screen.

### Option B: Web-Based Account Deletion Link
1. **Web Page:** Provide an accessible web URL (e.g. `https://fingerprint-cp.mobile.net.sa/privacy/delete-account`).
2. **In-App Link:** Add a clear link in `SettingsScreen.tsx` opening the deletion request URL in the device browser.
3. **App Store Metadata:** Provide the same URL in the Privacy Policy / Support URL fields in App Store Connect.

---

## 10. Requires Client/Backend Confirmation

The following questions require direct confirmation from the backend/engineering team:

1. **Does the backend API currently support an un-documented `DELETE /auth/me` or user deletion endpoint?**
2. **Does a public web URL exist for submitting account deletion requests?**
3. **What is the backend policy for data retention vs deletion when a school principal or teacher requests account deletion?**

---

## 11. Files and API Endpoints Inspected

### Frontend Source Files Inspected:
* [SignupScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/SignupScreen.tsx) — School registration wizard flow
* [LoginScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/LoginScreen.tsx) — Staff & Portal login tabs
* [TwoFaScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/auth/TwoFaScreen.tsx) — OTP verification screen
* [SettingsScreen.tsx](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/screens/main/SettingsScreen.tsx) — User preferences & logout screen
* [auth.store.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/store/auth.store.ts) — Authentication state management & actions
* [secureStorage.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/utils/secureStorage.ts) — Token persistence utility

### API Client Modules Inspected:
* [src/api/auth.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/auth.ts) — Staff authentication API functions
* [src/api/portal.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/portal.ts) — Student/Parent portal OTP API functions
* [src/api/client.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/client.ts) — Axios HTTP client & response interceptors
* [src/api/hr.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/hr.ts) — Employee management endpoints
* [src/api/students.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/api/students.ts) — Student management endpoints
* [src/services/settings.ts](file:///c:/Users/mohse/.gemini/antigravity/scratch/SchoolBitApp/src/services/settings.ts) — Settings & notification services

---

## SUMMARY AUDIT STATUS

* **Account Creation In-App:** **VERIFIED** *(School Representative registration flow exists in `SignupScreen.tsx`)*
* **In-App Account Deletion UI:** **NOT VERIFIED** *(Zero deletion UI or button exists in the app)*
* **Backend Deletion API:** **REQUIRES BACKEND CONFIRMATION** *(No self-deletion API endpoint present in frontend code)*
* **Apple Guideline 5.1.1(v) Compliance:** **REQUIRED BEFORE APP STORE SUBMISSION** *(Implementation of Option A or Option B is mandatory to pass Apple App Store review)*
