# Maintenance Log

This log tracks identified issues, inconsistencies, and errors within the codebase for systematic resolution.

---

### **Issue #1: Missing Consent Initialization in Staff Management**

*   **File**: `src/components/dashboard/settings/staff-management-tab.tsx`
*   **Problem**: When a new staff member is added, the `Membership` document is created without initializing the optional `consent` object.
*   **Impact**: This can lead to runtime errors in parts of the application that try to access `membership.consent.shareRecords`, as `consent` will be `undefined`. This is a data inconsistency.
*   **Proposed Fix**: Initialize the `consent` object with `{ shareRecords: false }` by default when creating a new `Membership` document for a staff member.
