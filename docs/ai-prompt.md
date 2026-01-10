
# AI Developer Prompt for Digi Health Project

## 1. Project Overview

**Digi Health** is a comprehensive digital health platform built for Bangladesh. It serves as a centralized system for managing personal health records and acts as a lightweight Hospital Information System (HIS). The platform is designed to be user-friendly, secure, and robust, with a particular focus on catering to users in both urban and rural settings.

The primary goal is to connect patients, doctors, and healthcare organizations seamlessly, providing secure access to medical data, improving communication, and streamlining healthcare management.

---

## 2. Core Concepts & Terminology

*   **Health ID:** A unique, randomly generated 10-digit numeric ID assigned to every user upon registration. This is the primary user-facing identifier.
*   **Organization:** Represents a healthcare entity like a hospital or clinic. Each user belongs to an organization. For individual patients not affiliated with a specific hospital, a unique personal organization ID is created for them.
*   **Roles:** The system is multi-faceted, with different user roles determining access levels and available features. The primary roles are:
    *   `patient`: The default role for all users. Can manage their own profile, vitals, and medical documents.
    *   `doctor`: Can search for patients within their organization, view their records, and add/edit medical notes.
    *   `hospital_owner`: Can manage hospital settings, including staff, facilities, and billing.
    *   Other professional roles include `nurse`, `marketing_rep`, `lab_technician`, etc.
*   **Non-blocking Updates:** A core principle in the app's Firebase interactions. Write operations (`setDoc`, `addDoc`, etc.) are not awaited in the UI. They are "fire-and-forget" from the component's perspective. Error handling is managed centrally via a global error emitter. This makes the UI feel fast and responsive.

---

## 3. Technology Stack

*   **Framework:** Next.js 14+ with App Router.
*   **Language:** TypeScript.
*   **UI Components:** ShadCN UI, built on Radix UI and Tailwind CSS.
*   **Styling:** Tailwind CSS with a theme defined in `src/app/globals.css`.
*   **Icons:** `lucide-react`.
*   **Backend & Database:** Firebase (Authentication, Firestore, Storage).
*   **Form Management:** React Hook Form with Zod for validation.
*   **Charts:** Recharts.

---

## 4. Firebase Architecture

Firebase is the backbone of the application.

### 4.1. Firebase Authentication

*   **Provider:** Email/Password authentication is the primary method.
*   **User UID:** The Firebase Auth UID is the internal, unique identifier for users and is used as the document ID in the `users` and `patients` Firestore collections.

### 4.2. Firestore Database

The database structure is defined in `docs/backend.json`.

*   `/users/{userId}`:
    *   **Description:** Stores the master profile for every user. `{userId}` is the Firebase Auth UID.
    *   **Schema:** Corresponds to the `User` entity. Contains `healthId`, `name`, `email`, `roles`, `organizationId`, `avatarUrl`, and a nested `demographics` object.
    *   **Security:** Users can only read/write their own document. Doctors can list users within their organization for search purposes.

*   `/patients/{patientId}`:
    *   **Description:** Stores the core patient-specific record. `{patientId}` is also the Firebase Auth UID, linking it directly to a user.
    *   **Schema:** Corresponds to the `Patient` entity. Contains essential data like `healthId`, `name`, `demographics`, `chronicConditions`, `allergies`, and a `redFlag` object for critical alerts.
    *   **Security:** A patient can only read their own record. A doctor can read/write patient records within their own organization.

*   **Patient Subcollections:**
    *   `/patients/{patientId}/medical_records/{recordId}`: Stores clinical encounter notes. Only doctors can create/update; patients can read.
    *   `/patients/{patientId}/record_files/{fileId}`: Stores user-uploaded files (images/PDFs). Only the patient can create/delete; doctors in the org can read.
    *   `/patients/{patientId}/vitals/{vitalId}`: Stores time-series vital signs data (BP, pulse, etc.). Patients can add their own vitals. Data is immutable (no updates/deletes).
    *   `/patients/{patientId}/privacy_log/{logId}`: **Crucial Feature**. An audit trail of who has accessed the patient's data. Automatically created when a doctor searches for a patient. **Only the patient themselves can read this log.**

### 4.3. Firebase Storage

*   **Security:** Rules are defined in `storage.rules`.
*   `/profile_pictures/{userId}`: Stores user profile images. Users can only write to their own path. Publicly readable.
*   `/record_files/{userId}/{fileName}`: Stores medical documents uploaded by patients. Only the owner can read/write.

---

## 5. Application Structure & Logic

### 5.1. Routing & Pages (`src/app`)

*   `/`: Public landing page.
*   `/login` & `/register`: Authentication pages using the `LoginForm` and `RegisterForm` components.
*   `/dashboard`: The main authenticated layout.
    *   `layout.tsx`: Wraps all dashboard pages, handles auth redirects, and renders the main sidebar/header structure.
    *   `page.tsx`: The "My Dashboard" view for a patient, showing `HealthIdCard`, `VitalsTracker`, etc.
    *   `/professional`: A dashboard for professional roles (e.g., `DoctorDashboard`).
    *   `/profile`: The user's main profile page, allowing them to view/edit personal and medical details and apply for new roles.
    *   `/my-records`: A gallery view for patients to upload, view, and manage their health documents (prescriptions, reports).
    *   `/privacy-log`: **Patient-only page** to view the audit trail of who has accessed their records.
    *   `/settings`: Page for account-level settings (privacy, subscription). Redirects to `/settings/hospital` for `hospital_owner` role.
    *   `/settings/hospital`: A multi-tabbed interface for hospital owners to manage staff, billing, schedules, and facilities.
    *   `/patients/{patientId}`: The detailed view of a single patient's record, visible to the patient themselves or a doctor in their organization.

### 5.2. Core Components (`src/components`)

*   `auth/`: Contains `LoginForm` and `RegisterForm`. Handles user registration (including generating the 10-digit Health ID) and login via Firebase Auth.
*   `dashboard/`: Contains all major components for the dashboard views.
    *   `doctor-dashboard.tsx`: Includes the patient search functionality (by Health ID or mobile number) and QR code scanner. Logs search actions to the `privacy_log`.
    *   `patient-dashboard.tsx`: The main view for patients.
    *   `health-id-card.tsx`: A key reusable component that displays the user's main identity, QR code, and handles profile picture uploads.
    *   `vitals-tracker.tsx`: Component for logging and visualizing patient vital signs.
    *   `record-viewer.tsx`: A dialog/modal for viewing images and PDFs from the `my-records` page.
    *   `settings/`: Components for the hospital owner's settings page, organized by tab (Staff, Billing, etc.).
*   `ui/`: Reusable, generic UI components from ShadCN (Button, Card, Input, etc.). The `sidebar.tsx` is a complex, custom component that provides the main navigation structure.

### 5.3. Firebase Integration (`src/firebase`)

*   `config.ts`: Exports the `firebaseConfig` object, including the `storageBucket`.
*   `index.ts` & `provider.tsx` & `client-provider.tsx`: These files set up the Firebase context for the entire application, providing initialized instances of Auth and Firestore. **This is the single source of truth for Firebase services.**
*   `errors.ts` & `error-emitter.ts`: Implements the custom error handling system. `FirestorePermissionError` creates detailed, LLM-friendly error messages for security rule violations, which are then thrown globally by the `FirebaseErrorListener` component.
*   `non-blocking-updates.tsx`: Contains helper functions like `addDocumentNonBlocking` that perform Firestore writes without `await`, following the app's "fire-and-forget" UI principle.

### 5.4. Custom Hooks (`src/hooks`)

*   `use-auth.ts`: **The primary hook for accessing user data**. It combines the user object from Firebase Auth with the user profile from Firestore, providing a single, unified `user` object. It also determines the user's `activeRole` and provides a `hasRole` helper function. **All components should use this hook to get user info.**
*   `use-toast.ts`: Manages system-wide notifications.

### 5.5. Library & Definitions (`src/lib`)

*   `definitions.ts`: Contains all TypeScript type definitions for the main data entities (`User`, `Patient`, `MedicalRecord`, etc.). This is the source of truth for data shapes.
*   `utils.ts`: Standard utility functions, primarily `cn` for merging Tailwind classes.

---

## 6. Development Principles & Constraints

*   **Beginner-Friendly Logic:** Prioritize simple, clear, and direct code. Avoid overly complex patterns.
*   **Robustness over Elegance:** Code must be resilient to partially loaded data. Always check for data existence (`if (user)`) before rendering, and use optional chaining (`user?.roles`) for safe property access.
*   **Centralized State Management:** User state is managed via the `useAuth` hook. Component-level state should be used for UI-specific logic (e.g., `isEditing`, form inputs).
*   **Security First:** Firestore and Storage rules are the ultimate authority. Client-side code should be written with these rules in mind. The `privacy_log` is a non-negotiable feature.
*   **Date Formatting:** All user-facing dates MUST be in `DD-MM-YYYY` format.
