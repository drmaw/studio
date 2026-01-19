# Digi Health: Project Guide

Welcome to the Digi Health project! This guide is designed to help a new developer understand the structure of the application, how data flows through it, and the core concepts that power it.

---

## 1. What is Digi Health?

**Digi Health** is a comprehensive digital health platform built for Bangladesh. It serves as a centralized system for managing personal health records and acts as a lightweight Hospital Information System (HIS).

The primary goal is to connect patients, doctors, and healthcare organizations seamlessly, providing secure access to medical data and streamlining healthcare management.

---

## 2. Core Concepts

To understand the app, you need to be familiar with these key terms:

*   **Health ID:** A unique, randomly generated 10-digit numeric ID assigned to every user. This is the main identifier for patients.
*   **Roles:** The system uses roles to control what a user can see and do. Key roles include:
    *   `patient`: The default role for all users.
    *   `doctor`: Can search for patients and manage their medical records.
    *   `hospital_owner`: Can manage hospital staff, schedules, and facilities.
    *   `admin`: Has super-user access to the entire platform.
*   **Organization:** Represents a healthcare entity like a hospital or clinic. Every user belongs to an organization. For individual patients, a personal organization is created to hold their records securely.

---

## 3. Technology Stack

This is a modern web application built with:

*   **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/) with [ShadCN UI](https://ui.shadcn.com/) components
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation

---

## 4. Project Structure

The codebase is organized into several key directories inside `src/`:

*   `app/`: **Pages & Routing**
    *   This is where all the pages of the application live, following the Next.js App Router structure. For example, `app/dashboard/profile/page.tsx` is the user's profile page.
    *   `layout.tsx` files define the UI shell for different sections of the app (e.g., the main dashboard sidebar).

*   `components/`: **Reusable UI Components**
    *   `ui/`: Generic components from ShadCN (e.g., `Button`, `Card`, `Input`).
    *   `dashboard/`: Larger components specific to a dashboard view (e.g., `PatientDashboard`, `DoctorDashboard`).
    *   `shared/`: Components that are reused across multiple pages (e.g., `PageHeader`, `ConfirmationDialog`).

*   `firebase/`: **Firebase Integration**
    *   This is the central hub for all Firebase-related code.
    *   `config.ts`: Contains the Firebase project configuration.
    *   `index.ts`: Initializes Firebase and exports all the necessary hooks and functions for the rest of the app to use.
    *   `provider.tsx`: A React Context provider that makes Firebase services available to all components.
    *   `firestore/`: Contains custom hooks (`useDoc`, `useCollection`) for reading data and wrapper functions (`addDocument`, `updateDocument`) for writing data.

*   `hooks/`: **Custom React Hooks**
    *   `use-auth.ts`: The most important hook for authentication. It provides the currently logged-in user's complete profile (combining Auth and Firestore data).
    *   `use-patient-search.ts`: A hook encapsulating the logic for finding patients by Health ID or mobile number.

*   `lib/`: **Utilities & Definitions**
    *   `definitions.ts`: Contains all TypeScript type definitions for our data models (e.g., `User`, `Patient`, `MedicalRecord`). This is the "single source of truth" for data shapes.
    *   `roles.ts`: Defines the role hierarchy and configurations.
    *   `utils.ts`: General utility functions.

*   `docs/`: **Project Blueprints**
    *   `backend.json`: A crucial file that defines the entire Firestore database schema. It serves as a blueprint for data structures used throughout the app.

---

## 5. Data & Authentication Flow

### Authentication
1.  A user signs in via the `LoginForm` (`src/components/auth/login-form.tsx`).
2.  The `FirebaseProvider` detects the authentication state change.
3.  The `useAuth` hook (`src/hooks/use-auth.ts`) combines the basic user info from Firebase Auth with the detailed user profile from the `/users/{userId}` document in Firestore.
4.  This combined `user` object, which includes their roles and other details, is made available to all components, which can then render the correct UI.

### Data Flow (Firestore)

*   **Reading Data:** Components **never** access Firestore directly. Instead, they use custom hooks:
    *   `useDoc(docRef)`: To get a single document in real-time (e.g., fetching a specific patient's profile).
    *   `useCollection(query)`: To get a list of documents from a collection in real-time (e.g., fetching all medical records for a patient).
    *   These hooks handle loading states, errors, and automatic UI updates when the data changes in the database.

*   **Writing Data:** To ensure a responsive UI, the app uses a **"non-blocking"** or **"fire-and-forget"** approach for writing data.
    *   Components use wrapper functions from `src/firebase/firestore/writes.ts` like `addDocument`, `updateDocument`, and `deleteDocument`.
    *   These functions are **not** `await`ed in the component. They immediately update the local data cache (for a fast UI response) and handle the database submission in the background.
    *   Error handling is managed centrally, so components don't need complex `try/catch` blocks.

---

## 6. Getting Started

As a new developer, here’s a suggested path to get comfortable with the codebase:

1.  **Start at the Entry Point:** Look at `src/app/dashboard/layout.tsx` and `src/app/dashboard/page.tsx`. This is the main entry point for a logged-in user.
2.  **Understand the User:** Examine `src/hooks/use-auth.ts`. This hook is the foundation of user session management and provides the `user` object to the entire app.
3.  **Trace the Data:** Open `src/components/dashboard/patient-dashboard.tsx`. See how it uses the `user` object from `useAuth` and fetches additional data (like `Vitals` and `Patient`) using the `useDoc` and `useCollection` hooks.
4.  **Follow an Action:** Look at the "Add Vitals" functionality in `src/components/dashboard/vitals-tracker.tsx`. Notice how it calls the `addDocument` function to write data to Firestore without `await`ing the result.

By following this path, you'll get a good overview of how pages are built, how data is managed, and how the core features of the application work together.
