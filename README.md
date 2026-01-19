# Digi Health: A Multi-Tenant Hospital Information System

**Digi Health** is a comprehensive, fully responsive digital health platform built for Bangladesh. It serves as a centralized system for managing personal health records and as a lightweight, multi-tenant Hospital Information System (HIS) for multiple healthcare organizations.

The primary goal is to connect patients, doctors, and healthcare organizations seamlessly, providing secure, isolated, and efficient access to medical data on any device—desktop, tablet, or mobile.

---

## Key Features

The platform provides a tailored experience based on user roles, ensuring secure and relevant access to features.

### For Patients
- **Personal Dashboard**: A central hub to view your Health ID, vitals, and recent activity.
- **Unified Health Record**: Upload, manage, and view your personal medical documents (prescriptions, reports) in one place.
- **Medical History**: A complete, chronological timeline of your clinical records from all visited organizations.
- **Appointment Self-Scheduling**: Browse hospitals and doctors to book your own appointments.
- **Secure Messaging**: Communicate directly and securely with healthcare professionals.
- **Granular Privacy Controls**: Manage data sharing consent on a per-hospital basis and view a detailed audit log of who has accessed your data.
- **FHIR Data Export**: Export your personal health data in the interoperable FHIR format.

### For Doctors & Professionals
- **Role-Specific Dashboards**: Dedicated dashboards for Doctors, Nurses, Lab Technicians, and other professionals.
- **Patient Search**: Securely find patients within your organization via Health ID, mobile number, or QR code scan.
- **Digital Medical Records**: Create, view, and edit clinical notes using standardized ICD-10 codes.
- **LIS & Billing Integration**: Order lab tests and have the costs automatically added to the patient's invoice.
- **Schedule Management**: View upcoming appointments and manage your chamber schedules.
- **Duty Roster**: View your upcoming shifts and duty assignments.

### For Hospital Owners & Managers
- **Advanced Hospital Settings**: A multi-tab interface to manage all aspects of the organization.
- **Staff Management**: Onboard new staff and assign professional roles.
- **Human Resources (HR) Module**: Manage detailed employee profiles and create weekly duty rosters.
- **Billing & Invoicing**: Create and manage patient invoices with detailed line items.
- **ADT & Bed Management**: Manage patient Admission, Discharge, and Transfer (ADT), with a real-time visual dashboard for bed status.
- **Inventory Management**: Track and manage hospital supplies with stock-level monitoring and audit logs.
- **Advanced Reporting**: View dashboards for financial and operational analytics, powered by efficient server-side data aggregation.
- **Financial Controls**: A system for managers to settle cash accounts with owners, ensuring a clear audit trail.

---

## Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI Library**: [React](https://react.dev/) with [ShadCN UI](https://ui.shadcn.com/) components
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Fully Responsive Design)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
*   **Charts**: [Recharts](https://recharts.org/)

---

## Core Architectural Principles

- **Multi-Tenancy & Data Isolation**: The system is built on an organization-centric model. All clinical data (medical records, appointments, invoices) is strictly siloed within the hospital that creates it, enforced by robust Firestore Security Rules.
- **Role-Based Access Control (RBAC)**: A user's capabilities are determined by their roles *within a specific organization*. A single user can hold different roles across multiple hospitals, and the UI adapts accordingly.
- **Real-time & Responsive UI**: Leveraging Firestore's real-time listeners, the UI updates instantly to reflect data changes (e.g., bed status, new messages, appointment confirmations). The entire interface is designed to be fully usable on desktop, tablet, and mobile devices.
- **Scalability & Performance**: Designed for high efficiency. All long data lists are paginated, and resource-intensive analytics dashboards are powered by pre-aggregated summary documents to ensure fast load times and low operational costs.

---

## Project Blueprints

The architectural foundation of this project is explicitly defined in two key documents:

*   `docs/backend.json`: The master blueprint defining all data entities and the complete Firestore database structure.
*   `firestore.rules`: The security layer that enforces the multi-tenant data access model defined in `backend.json`.