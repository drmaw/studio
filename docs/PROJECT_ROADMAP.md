
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

### **Phase 4: Core Clinical Workflow Automation**

**Goal**: Digitize the laboratory process, enhance appointment management, and provide better operational oversight.

*   **Step 4.1: Develop Laboratory Information System (LIS) Module**:
    *   **Data Flow**: Doctor (EMR) → `LabTestOrder` created → Lab Tech (Dashboard) → `LabTestResult` created → Doctor notified & result attached to EMR → `Invoice` updated.
    *   **Task 4.1.1: Blueprinting**: Define `LabTestOrder` and `LabTestResult` entities in the data model. Update `backend.json` with new collection paths (`/organizations/{orgId}/lab_orders` and `/organizations/{orgId}/lab_results/{patientId}/results`), update `definitions.ts` with TypeScript types, and add security rules to `firestore.rules`.
    *   **Task 4.1.2: Implement Digital Test Ordering**: Add a feature to the patient detail page for doctors to order specific lab tests. This will create a `LabTestOrder` document. The list of available tests will be managed under a new "Lab Services" section in the Hospital Settings.
    *   **Task 4.1.3: Build Lab Technician Dashboard**: Create a new dashboard page for users with the `lab_technician` role. This page will display a list of pending `LabTestOrder`s. Technicians can select an order, input the results, and mark it as 'completed', which creates a `LabTestResult` document.
    *   **Task 4.1.4: Integrate LIS with Billing**: When a `LabTestOrder` is created, automatically add the cost of the test as a line item to the patient's current draft/open invoice.

*   **Step 4.2: Implement Intelligent Appointment Slot Management**:
    *   **Data Flow**: Patient/Staff (Booking Dialog) → Query `appointments` collection → Disable booked slots in UI.
    *   **Task 4.2.1: Enhance Booking Logic**: In the `BookAppointmentDialog` component, before rendering time slots, query the `appointments` collection for the selected doctor and date. Any time slots that already have a `confirmed` or `pending` appointment will be disabled in the UI, preventing double-booking.

---

### **Phase 5: Patient Empowerment and Engagement**

**Goal**: Give patients more direct control and better tools to manage their healthcare journey.

*   **Step 5.1: Implement Patient Appointment Self-Scheduling**:
    *   **Data Flow**: Patient (UI) → Selects Organization/Doctor/Slot → `Appointment` document created with `pending` status → Doctor is notified.
    *   **Task 5.1.1: Build Patient-Facing Booking UI**: Create a new page where patients can browse organizations, view doctor profiles within them, and see their available schedules. This reuses the existing schedule components but presents them in a patient-centric discovery flow.
    *   **Task 5.1.2: Implement Patient Booking Logic**: Allow patients to select a time slot and request an appointment. This will use the same `BookAppointmentDialog` logic as the staff-facing feature, creating an `Appointment` document with a 'pending' status and notifying the doctor.

*   **Step 5.2: Develop Secure Messaging Module**:
    *   **Data Flow**: User (Messaging UI) → Create `Message` document within a `Conversation` subcollection → Real-time listener updates UI for other participant.
    *   **Task 5.2.1: Blueprinting**: Define `Conversation` and `Message` entities. `Conversations` will be a top-level collection (`/conversations/{conversationId}`) containing participants' IDs. `Messages` will be a subcollection (`/conversations/{conversationId}/messages`). Update `backend.json`, `definitions.ts`, and `firestore.rules` to allow participants to read/write.
    *   **Task 5.2.2: Build Messaging UI**: Create a new "Messages" page accessible from the sidebar. It will show a list of conversations on one side and the selected conversation's messages on the other.
    *   **Task 5.2.3: Implement Real-Time Messaging**: Use Firestore's real-time listeners (`useCollection`) to display new messages instantly. Implement a form to create and send new `Message` documents.

---

### **Phase 6: Advanced Hospital Management & Analytics**

**Goal**: Provide hospital owners with powerful tools for operational oversight, resource management, and strategic decision-making.

*   **Step 6.1: Develop Bed Management Dashboard**:
    *   **Data Flow**: Staff (Admit/Discharge UI) → Update `Facility` document `status` → Bed Management Dashboard UI updates in real-time.
    *   **Task 6.1.1: Enhance Facility Data Model**: The `Facility` entity in `definitions.ts` and `backend.json` will be updated to include a map or array of `beds`, each with its own `status` ('available', 'occupied', 'cleaning').
    *   **Task 6.1.2: Build Bed Management UI**: Create a new "Bed Management" dashboard page. This will be a visual grid displaying all facilities (wards, cabins) and the real-time status of each individual bed within them, using color-coding for clarity.
    *   **Task 6.1.3: Integrate ADT with Bed Management**: Modify the `AdmitPatientDialog` to only show available beds. When a patient is admitted or discharged, update the status of the specific bed within the corresponding `Facility` document.

*   **Step 6.2: Implement General Inventory Management**:
    *   **Data Flow**: Manager (UI) → `InventoryItem` updated → `StockLog` created.
    *   **Task 6.2.1: Blueprinting**: Define `InventoryItem` (for stock levels) and `StockLog` (for audit trail) entities. Add new collection paths (`/organizations/{orgId}/inventory` and `/organizations/{orgId}/stock_logs`) to `backend.json`, `definitions.ts`, and `firestore.rules`.
    *   **Task 6.2.2: Build Inventory Dashboard**: Create a new tab in the Hospital Settings for "Inventory". This will be a table of all general supplies (gloves, syringes, etc.), showing current stock levels. It will include forms to add new items and update quantities. Updating a quantity will also create a `StockLog` entry for auditing purposes.

*   **Step 6.3: Build Advanced Reporting & Analytics Engine**:
    *   **Data Flow**: Scheduled Function/Admin Action → Aggregates data from `invoices`, `admissions`, etc. → Saves aggregated data to a new `reports` collection → Dashboard UI reads from `reports`.
    *   **Task 6.3.1: Create Financial Reports Dashboard**: A new "Reports" page for managers showing key financial metrics. This will involve creating backend logic (potentially a Firebase Function, not implemented by agent) to periodically aggregate data from the `invoices` collection into summary documents for efficient display. Charts will visualize revenue over time, outstanding balances, and top-performing services.
    *   **Task 6.3.2: Create Operational Reports Dashboard**: A second tab on the "Reports" page for operational metrics. This will show charts for bed occupancy rates, average patient length of stay (calculated from `admissions` data), and new patient registrations over time.

---

### **Phase 7: Alignment with Global Health & Data Protection Standards**

**Goal**: Evolve the platform into a system that is demonstrably safe, ethical, and legally compliant by aligning with WHO recommendations and international data protection principles.

*   **Step 7.1: Implement Standardized Medical Terminologies (WHO)**
    *   **Data Flow**: User (Doctor) enters diagnosis → UI presents a searchable list of ICD-10 codes → Doctor selects code → Coded value is stored alongside the text description in the `MedicalRecord`.
    *   **Task 7.1.1: Integrate ICD-10 Standard**: Replace the free-text `diagnosis` input in the `AddMedicalRecordDialog` with a searchable dropdown or autocomplete component populated with ICD-10 codes and descriptions.
    *   **Task 7.1.2: Update Data Model for Coded Data**: Modify the `MedicalRecord` entity in `definitions.ts` and `backend.json` to store both the selected code (e.g., `J20.9`) and the text description.

*   **Step 7.2: Enhance Accessibility (WHO)**
    *   **Data Flow**: Not applicable (UI/UX enhancement).
    *   **Task 7.2.1: Conduct Full WCAG Audit**: Systematically review every component and page against WCAG 2.1 AA standards.
    *   **Task 7.2.2: Remediate Accessibility Issues**: Implement necessary code changes, such as adding `aria-label` attributes to icon-only buttons, ensuring all form inputs are linked to labels, verifying keyboard navigability, and correcting color contrast ratios where needed.

*   **Step 7.3: Strengthen Data Protection Rights (PDPO)**
    *   **Data Flow**: Patient navigates to Privacy Settings → Clicks a "Request Correction" button on a record → A `CorrectionRequest` document is created → Appears on an admin/doctor dashboard for review.
    *   **Task 7.3.1: Create Static Privacy Policy Page**: Add a new page at `/privacy-policy` and link to it from the app's footer.
    *   **Task 7.3.2: Implement "Right to Rectification" Workflow**:
        *   **Blueprinting**: Add a `CorrectionRequest` entity to `backend.json` and `definitions.ts`.
        *   **UI Work**: Add a "Request Correction" button to the `MedicalRecordCard`. This opens a dialog for the patient to explain the needed correction.
        *   **Admin UI**: Create a new tab or section in the hospital/admin dashboard to list and manage these requests.
    *   **Task 7.3.3: Implement Explicit Consent Modal**: Modify the `AccountSettingsTab` so that when a patient enables data sharing for a hospital for the first time, a modal appears requiring them to explicitly agree to the terms of sharing.

*   **Step 7.4: Ensure Comprehensive Traceability & Transparency**
    *   **Data Flow**: Any action that modifies data (e.g., confirming an appointment, changing a role) → A new, descriptive `PrivacyLog` document is created in a Firestore `WriteBatch` along with the primary data modification.
    *   **Task 7.4.1: Expand `PrivacyLog` Triggers**: Go through key workflows (`book-appointment`, `staff-management`, `account-settings`) and add logic to create a detailed log entry for every significant user action.
    *   **Task 7.4.2: Enhance Log Descriptors**: Make log messages more human-readable (e.g., "Dr. X confirmed appointment for Patient Y" instead of "update_appointment_status").
    *   **Task 7.4.3: Improve Privacy Log UI**: Add filtering controls (by date, organization, and action type) to the `/dashboard/privacy-log` page to allow patients to easily search and audit their activity history.
