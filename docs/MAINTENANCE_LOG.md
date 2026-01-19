# Maintenance Log

This log tracks identified issues, inconsistencies, and errors within the codebase for systematic resolution.

---

### **Issue #1: Missing Consent Initialization in Staff Management**

*   **File**: `src/components/dashboard/settings/staff-management-tab.tsx`
*   **Problem**: When a new staff member is added, the `Membership` document is created without initializing the optional `consent` object.
*   **Impact**: This can lead to runtime errors in parts of the application that try to access `membership.consent.shareRecords`, as `consent` will be `undefined`. This is a data inconsistency.
*   **Proposed Fix**: Initialize the `consent` object with `{ shareRecords: false }` by default when creating a new `Membership` document for a staff member.

---

### **Issue #2: Stale Membership Data**

*   **File**: `src/hooks/use-auth.ts`
*   **Problem**: The `useAuth` hook uses `getDocs` to fetch a user's memberships one time when the hook initializes.
*   **Impact**: If an administrator adds or removes a role from a user in a different browser session, the user's UI will not update to reflect their new permissions or available dashboards until they manually refresh the page. This leads to a stale and potentially confusing user experience.
*   **Proposed Fix**: Refactor the `useEffect` in `useAuth.ts` to use `onSnapshot` on the `members` collection group query. This will ensure that any changes to a user's memberships are pushed to the client in real-time, keeping their session data and permissions consistently up-to-date.
