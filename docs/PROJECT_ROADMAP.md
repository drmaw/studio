# Digi Health: Project Roadmap

**Note on Implementation:** While implementing the roadmap steps, the process will maintain simplicity and consistency. Any step requiring modification of a linked or existing file will be done instantly as part of the implementation of that step.

---

### **Phase 1: Architectural Foundation (✓ Complete)**

This foundational phase established the core multi-tenant architecture required for scalability and security.

*   **[✓] Redesigned the Data Model**: Shifted from a user-centric to an organization-centric model in `docs/backend.json`.
*   **[✓] Rewrote Security Rules**: Overhauled `firestore.rules` to enforce the new organization-centric data access model.
*   **[✓] Updated Project Documentation**: Updated `README.md` to reflect the new architecture.

---

### **Phase 2: Build Core HIS Modules (✓ Complete)**

**Goal**: Build the essential modules that a hospital needs to operate effectively for revenue and patient management.

*   **[✓] Step 2.1: Develop Billing & Invoicing Module**:
    *   **[✓] Task 2.1.1**: Define `Invoice` and `InvoiceItem` entities.
    *   **[✓] Task 2.1.2**: Implement the main Invoicing Dashboard.
    *   **[✓] Task 2.1.3**: Build the Invoice Detail page.
    *   **[✓] Task 2.1.4**: Implement Discount Authority.

*   **[✓] Step 2.2: Implement In-Patient Management (ADT - Admission, Discharge, Transfer)**:
    *   **[✓] Task 2.2.1**: Update data models with the `Admission` entity.
    *   **[✓] Task 2.2.2**: Create an "Admissions Dashboard" to admit new patients.
    *   **[✓] Task 2.2.3**: Implement the "Discharge Patient" workflow, integrating final billing calculations.

---

### **Phase 3: Enhance Data Control & Patient Experience (✓ Complete)**

**Goal**: Empower patients with greater control and a comprehensive view of their health data.

*   **[✓] Step 3.1: Create a Unified Health Record View**:
    *   **[✓] Task**: Build a central view where a patient can see a complete, chronological timeline of their medical history, aggregating records from all visited organizations.

*   **[✓] Step 3.2: Implement Consent Management**:
    *   **[✓] Task**: Create a "Data & Privacy" settings page where patients can manage data sharing permissions on a per-organization basis.

---

### **Phase 4: Core Clinical Workflow Automation (✓ Complete)**

**Goal**: Digitize the laboratory process and enhance appointment management to reduce errors and improve efficiency.

*   **[✓] Step 4.1: Develop Laboratory Information System (LIS) Module**:
    *   **[✓] Task 4.1.1: Blueprinting**: Define `LabTestOrder` and `LabTestResult` entities in the data model and security rules.
    *   **[✓] Task 4.1.2: Implement Digital Test Ordering**: Add a feature for doctors to order specific lab tests, creating a `LabTestOrder` document.
    *   **[✓] Task 4.1.3: Build Lab Technician Dashboard**: Create a functional dashboard for `lab_technician` role to view pending orders and input results.
    *   **[✓] Task 4.1.4: Integrate LIS with Billing**: Automatically add the cost of a lab test as a line item to the patient's invoice when ordered.

*   **[✓] Step 4.2: Implement Intelligent Appointment Slot Management**:
    *   **Data Flow**: Patient/Staff (Booking Dialog) → Query `appointments` collection → Disable booked slots in UI.
    *   **[✓] Task 4.2.1: Enhance Booking Logic**: In the `BookAppointmentDialog`, query the `appointments` collection for the selected doctor and date to disable unavailable time slots, preventing double-booking.

---

### **Phase 5: Patient Empowerment and Engagement (In Progress)**

**Goal**: Give patients more direct control and better tools to manage their healthcare journey.

*   **[✓] Step 5.1: Implement Patient Appointment Self-Scheduling**:
    *   **Data Flow**: Patient (UI) → Selects Organization/Doctor/Slot → `Appointment` document created with `pending` status → Doctor is notified.
    *   **[✓] Task 5.1.1: Build Patient-Facing Booking UI**: Create a new page where patients can browse organizations, view doctor profiles, and see their available schedules.
    *   **[✓] Task 5.1.2: Implement Patient Booking Logic**: Allow patients to request an appointment, creating an `Appointment` document with a 'pending' status.

*   **Step 5.2: Develop Secure Messaging Module**:
    *   **Data Flow**: User (Messaging UI) → Create `Message` document within a `Conversation` subcollection → Real-time listener updates UI for other participant.
    *   **[✓] Task 5.2.1: Blueprinting**: Define `Conversation` and `Message` entities and configure security rules.
    *   **Task 5.2.2: Build Messaging UI**: Create a new "Messages" page showing a list of conversations and the selected conversation's messages.
    *   **Task 5.2.3: Implement Real-Time Messaging**: Use Firestore's real-time listeners to display new messages instantly.

---

### **Phase 6: Advanced Hospital Management & Analytics**

**Goal**: Provide hospital owners with powerful tools for operational oversight, resource management, and strategic decision-making.

*   **Step 6.1: Develop Bed Management Dashboard**:
    *   **Data Flow**: Staff (Admit/Discharge UI) → Update `Facility` document `status` → Bed Management Dashboard UI updates in real-time.
    *   **Task 6.1.1: Enhance Facility Data Model**: Update the `Facility` entity to include a map of `beds`, each with its own `status` ('available', 'occupied').
    *   **Task 6.1.2: Build Bed Management UI**: Create a visual "Bed Management" dashboard showing the real-time status of all beds.
    *   **Task 6.1.3: Integrate ADT with Bed Management**: Modify the `AdmitPatientDialog` to only show available beds and update bed status on admission/discharge.

*   **Step 6.2: Implement General Inventory Management**:
    *   **Data Flow**: Manager (UI) → `InventoryItem` updated → `StockLog` created.
    *   **Task 6.2.1: Blueprinting**: Define `InventoryItem` (for stock levels) and `StockLog` (for audit trail) entities.
    *   **Task 6.2.2: Build Inventory Dashboard**: Create a new tab in Hospital Settings for managing general supplies and tracking stock levels.

*   **Step 6.3: Build Advanced Reporting & Analytics Engine**:
    *   **Data Flow**: Backend process aggregates data from `invoices`, `admissions`, etc. → Saves aggregated data to a new `reports` collection → Dashboard UI reads from `reports`.
    *   **Task 6.3.1: Create Financial Reports Dashboard**: Create a new "Reports" page showing key financial metrics like revenue over time and outstanding balances.
    *   **Task 6.3.2: Create Operational Reports Dashboard**: Add operational metrics to the "Reports" page, such as bed occupancy rates and average patient length of stay.

*   **Step 6.4: Implement Advanced Financial Controls**:
    *   **Data Flow**: Manager (Cashier UI) → Initiates settlement → `Settlement` document created → Owner is notified → Owner confirms physical cash transfer → `Settlement` status updated.
    *   **Task 6.4.1: Blueprinting**: Define a `Settlement` entity to track cash hand-offs.
    *   **Task 6.4.2: Build Manager's Cashier Dashboard**: Create a dashboard for managers showing "cash-in-hand" and a button to initiate a settlement.
    *   **Task 6.4.3: Build Owner's Reconciliation Dashboard**: Create a section for owners to view and confirm pending settlements, creating an audit trail.
    *   **Task 6.4.4: Refine UI Access Control**: Review the `SidebarNav` and other UI components to enforce the Owner > Manager hierarchy, hiding sensitive settings from managers.

*   **Step 6.5: Implement Human Resources (HR) Module**:
    *   **Data Flow**: Manager (HR UI) → Updates employee contract details / Creates weekly roster → `Membership` document updated / `DutyRoster` document created. Staff → Views their upcoming shifts on their personal dashboard.
    *   **Task 6.5.1: Develop Detailed Employee Profiles**:
        *   **Blueprinting**: Enhance the `Membership` entity in `backend.json` and `definitions.ts` to include a private `employeeDetails` object (containing fields for joining date, salary, bank info, etc.). Access to this object will be strictly limited to `manager` and `hospital_owner` roles via security rules.
        *   **UI Work**: Create a new "HR" or "Payroll" tab within the Hospital Settings page. Build an interface for managers to view staff members and manage their detailed employment profiles.
    *   **Task 6.5.2: Build Duty Roster Management**:
        *   **Blueprinting**: Define a new `DutyRoster` entity to store shift assignments for a given date/week. This will include `userId`, `shiftType` (e.g., Morning, Night), and `dutyArea` (e.g., Ward A).
        *   **UI Work**: In the new "HR" tab, build a visual roster management tool. This will allow managers to create weekly schedules and assign staff to different shifts and locations within the hospital.
        *   **Dashboard Integration**: On each professional's dashboard (e.g., `NurseDashboard`), add a "My Upcoming Shifts" component that displays their personal schedule for the next 7 days by querying the `rosters` collection.

---

### **Phase 7: Alignment with Global Health & Data Protection Standards**

**Goal**: Evolve the platform into a system that is demonstrably safe, ethical, and legally compliant.

*   **Step 7.1: Implement Standardized Medical Terminologies (WHO)**
    *   **Task**: Replace free-text diagnosis inputs with a searchable component populated with ICD-10 codes.

*   **Step 7.2: Enhance Accessibility (WHO)**
    *   **Task**: Conduct a full WCAG 2.1 AA audit and remediate all identified issues.

*   **Step 7.3: Strengthen Data Protection Rights (PDPO)**
    *   **Task 7.3.1**: Create a static `/privacy-policy` page.
    *   **Task 7.3.2**: Implement a "Right to Rectification" workflow allowing patients to request corrections to their clinical records.
    *   **Task 7.3.3**: Implement an explicit consent modal for first-time data sharing.

*   **Step 7.4: Ensure Comprehensive Traceability & Transparency**
    *   **Task**: Expand the `PrivacyLog` to trigger on every significant user action (e.g., confirming appointments, changing roles) and make the log messages more descriptive.
    
*   **Step 7.5: Enable Data Interoperability (FHIR)**
    *   **Data Flow**: Digi Health System → FHIR Transformation Layer → FHIR-compliant API Endpoint → External System.
    *   **Task 7.5.1**: Map internal data models (`Patient`, `MedicalRecord`) to standard FHIR resources.
    *   **Task 7.5.2**: Develop a secure, API layer that exposes patient data in the FHIR format.

---

### **Phase 8: Performance & Scalability Optimization**

**Goal**: Refactor key parts of the application to ensure it remains fast and cost-effective at large scale.

*   **Step 8.1: Implement Server-Side Aggregation for Dashboards**:
    *   **Task**: Refactor the `AdminStats` component to read from a pre-aggregated `/stats/platform` document instead of performing client-side counts.

*   **Step 8.2: Denormalize Data to Optimize Read-Heavy Screens**:
    *   **Task**: Update the logic for adding staff members to copy their `name` and `avatarUrl` directly into the `Membership` document to speed up list loading in the `StaffManagementTab`.

*   **Step 8.3: Implement Query Pagination for All Long Lists**:
    *   **Task**: Refactor all list views (Invoices, Staff, Medical History, etc.) to load data in pages using `limit()` and `startAfter()` queries, adding "Load More" buttons.
