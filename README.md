
# Digi Health: Project Guide

Welcome to the Digi Health project! This guide is designed to help a new developer understand the structure of the application, how data flows through it, and the core architectural concepts that power it. This is a multi-tenant Hospital Information System (HIS) designed for scalability.

---

## 1. What is Digi Health?

**Digi Health** is a comprehensive digital health platform built for Bangladesh. It serves as a centralized system for managing personal health records and acts as a lightweight Hospital Information System (HIS) for multiple healthcare organizations.

The primary goal is to connect patients, doctors, and healthcare organizations seamlessly, providing secure, isolated, and efficient access to medical data.

---

## 2. Core Architectural Concepts

This is not a simple monolithic app. It's a **multi-tenant system** where data is strictly isolated between different hospitals. Understanding these concepts is critical.

*   **User (The Person):** Represents a single person's identity (`/users/{userId}`). It holds their name, login credentials (via Firebase Auth), and core demographic data. A User can exist without belonging to any hospital.

*   **Organization (The Hospital):** Represents a healthcare entity like a hospital or clinic (`/organizations/{orgId}`). This is the primary data silo. All clinical data is owned by and stored under an organization.

*   **Membership (The Relationship):** This is the most important concept. A `Membership` links a **User** to an **Organization** and defines their **Roles** *within that specific hospital*.
    *   A single User can have multiple Memberships (e.g., Dr. Jane is a `doctor` at Hospital A and a `cardiologist` at Hospital B).
    *   This data is stored in `/organizations/{orgId}/members/{userId}`.
    *   This model allows for real-world scenarios and scalable, organization-scoped security rules.

*   **Active Organization Context:** Because a user can belong to multiple organizations, the application UI must maintain an "active organization" context in the user's session. All actions (like searching for a patient or viewing appointments) are performed within the context of this active organization.

---

## 3. Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/) with [ShadCN UI](https://ui.shadcn.com/) components
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation

---

## 4. Project Structure (`src/`)

*   `app/`: **Pages & Routing**
    *   Follows the Next.js App Router structure. `app/dashboard/page.tsx` is the user's main dashboard.

*   `components/`: **Reusable UI Components**
    *   `ui/`: Generic components from ShadCN (e.g., `Button`, `Card`).
    *   `dashboard/`: Larger components specific to a dashboard view.
    *   `shared/`: Components reused across multiple pages.

*   `firebase/`: **Firebase Integration**
    *   The central hub for all Firebase code.
    *   `index.ts`: Initializes Firebase and exports all necessary hooks and functions.
    *   `firestore/`: Contains custom hooks (`useDoc`, `useCollection`) for reading data and wrapper functions (`addDocument`, `updateDocument`) for writing data.

*   `hooks/`: **Custom React Hooks**
    *   `use-auth.ts`: **The most important hook for authentication.** It combines the base user from Firebase Auth with their detailed profile from Firestore and manages their list of memberships.

*   `lib/`: **Utilities & Definitions**
    *   `definitions.ts`: TypeScript type definitions for all data models. This is the "single source of truth" for data shapes.
    *   `roles.ts`: Defines the role hierarchy and configurations.

*   `docs/`: **Project Blueprints**
    *   `backend.json`: **The architectural diagram.** This crucial file defines the entire Firestore database schema, including all entities and their relationships.
    *   `firestore.rules`: **The security foundation.** These rules enforce the organization-centric data access model defined in `backend.json`.

---

## 5. Data & Security Flow

### Authentication & Authorization
1.  A user signs in via the `LoginForm`.
2.  The `useAuth` hook fetches the user's core profile and their list of `Memberships` from all organizations they belong to.
3.  The user selects an "active organization" to act within (e.g., "Work at Hospital A").
4.  All subsequent actions in the app are performed using the roles and permissions associated with that active membership.

### Data Siloing (The Core Principle)

*   **Global Data (What is universal):**
    *   `/users/{userId}`: Core identity.
    *   `/patients/{patientId}`: Global health data (allergies, chronic conditions).
    *   `/patients/{patientId}/record_files`: A patient's personal, self-uploaded documents.
*   **Organization-Scoped Data (What is siloed):**
    *   `/organizations/{orgId}/medical_records`: Clinical notes created *by* a hospital *about* a patient. Hospital A cannot see records from Hospital B.
    *   `/organizations/{orgId}/appointments`: Appointments are specific to one hospital.
    *   `/organizations/{orgId}/schedules`: Doctor schedules are managed per-hospital.
    *   `/organizations/{orgId}/members`: User roles are defined per-hospital.

### Data Flow Example: Viewing a Medical Record

1.  A doctor logs in and selects "Hospital A" as their active organization.
2.  They search for a patient. The search query is **scoped to `/organizations/hospital-a/`**, making it fast and secure.
3.  When they open the patient's chart, the app queries `/organizations/hospital-a/medical_records/{patientId}/...` to get the records.
4.  `firestore.rules` verifies that the doctor has a `doctor` role within `members` subcollection of "Hospital A" before allowing the read operation.
5.  If the same doctor switches their active organization to "Hospital B", they will only see records created by Hospital B.

---

## 6. Getting Started

As a new developer, here’s a suggested path to get comfortable with this multi-tenant codebase:

1.  **Start at the Blueprints:** Carefully study `docs/backend.json` and `firestore.rules`. Understanding the data silos and relationships is essential.
2.  **Understand the User Session:** Examine `src/hooks/use-auth.ts`. This hook is the foundation of session management. See how it fetches memberships and establishes the user's context.
3.  **Trace a Scoped Query:** Open a component like `src/components/dashboard/doctor-dashboard.tsx`. Notice how it will need to use the "active organization" ID from the `useAuth` hook to query for data (e.g., schedules or appointments) within that specific organization.
4.  **Follow a Write Operation:** Look at "Add Medical Record" (`src/components/dashboard/add-medical-record-dialog.tsx`). See how it must write the new record to the path `/organizations/{activeOrgId}/medical_records/...`.

By following this path, you'll understand the core multi-tenant architecture that allows Digi Health to scale securely and efficiently.
