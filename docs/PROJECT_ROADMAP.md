
# Digi Health: Project Roadmap

This document outlines the phased development plan to build Digi Health into a full-featured, multi-tenant Hospital Information System (HIS) and Personal Health Record (PHR) platform. This serves as our persistent guide to ensure a structured and resumable development process.

---

### **Phase 0: Architectural Foundation (✓ Complete)**

This foundational phase established the core multi-tenant architecture required for scalability and security.

*   **[✓] Redesigned the Data Model**: Shifted from a user-centric to an organization-centric model in `docs/backend.json`. This introduced the concept of `Memberships` and ensures all clinical data is siloed under the creating organization.
*   **[✓] Rewrote Security Rules**: Overhauled `firestore.rules` to enforce the new organization-centric data access model.
*   **[✓] Updated Project Documentation**: Updated `README.md` to reflect the new architecture.

---

### **Phase 1: Adapt UI to the New Architecture (✓ Complete)**

**Goal**: Make the existing application functional again by aligning the UI with the new, organization-centric data model.

*   **[✓] Step 1.1: Implement Active Organization Context**: Updated the `useAuth` hook and `UserNav` to manage and switch between a user's organizational memberships.
*   **[✓] Step 1.2: Refactor All Professional-Facing Queries**: Updated all professional views (`StaffManagement`, `DoctorDashboard`, `PatientDetailPage`, etc.) to query data from within the active organization's sub-collections.
*   **[✓] Step 1.3: Refactor Patient-Facing Views**: Updated patient-facing pages (`MyAppointments`, `PatientDetailPage`) to aggregate data from across all organizations they have interacted with.

---

### **Phase 2: Build Core HIS Modules (✓ Complete)**

**Goal**: Build the essential modules that a hospital needs to operate effectively.

*   **[✓] Step 2.1: Develop Billing & Invoicing Module**:
    *   **[✓] Task 2.1.1**: Define `Invoice` and `InvoiceItem` entities in `backend.json` and `definitions.ts`.
    *   **[✓] Task 2.1.2**: Implement the main Invoicing Dashboard for creating draft invoices.
    *   **[✓] Task 2.1.3**: Build the Invoice Detail page to manage line items and invoice status.
    *   **[✓] Task 2.1.4**: Integrate admission and discharge events with the billing module.

*   **[✓] Step 2.2: Implement In-Patient Management (ADT - Admission, Discharge, Transfer)**:
    *   **[✓] Task 2.2.1**: Update `backend.json`, `definitions.ts`, and `firestore.rules` with the `Admission` entity and security.
    *   **[✓] Task 2.2.2**: Create an "Admissions Dashboard" with a workflow to admit new patients.
    *   **[✓] Task 2.2.3**: Implement the "Discharge Patient" workflow.

---

### **Phase 3: Enhance Data Control & Patient Experience (✓ Complete)**

**Goal**: Empower patients with greater control and a comprehensive view of their health data.

*   **[✓] Step 3.1: Create a Unified Health Record View**:
    *   **[✓] Task**: Build a central view where a patient can see a complete, chronological timeline of their medical history, aggregating records from every organization they have visited.

*   **[✓] Step 3.2: Implement Consent Management**:
    *   **[✓] Task**: Create a "Data & Privacy" settings page where patients can manage data sharing permissions on a per-organization basis, giving them granular control over who can access their records.

---










