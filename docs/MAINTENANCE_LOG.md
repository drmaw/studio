# Maintenance Log

This log tracks identified issues, inconsistencies, and errors within the codebase for systematic resolution.

---

### **Issue #1: Incomplete Membership on User Registration**

*   **File**: `src/components/auth/register-form.tsx`
*   **Problem**: When a new user registers, a `Membership` document is created for their personal organization, but the optional `consent` object is not initialized.
*   **Impact**: This can lead to runtime errors if other parts of the application attempt to access `membership.consent.shareRecords`, as `consent` will be `undefined`.
*   **Proposed Fix**: Initialize the `consent` object with `{ shareRecords: false }` by default when creating the initial `Membership` document during registration.

---

### **Issue #2: Stale Membership Data in User Session**

*   **File**: `src/hooks/use-auth.ts`
*   **Problem**: The `useAuth` hook uses `getDocs` to fetch a user's memberships only once when the application loads.
*   **Impact**: If an administrator adds the user to a new organization or changes their roles in a different session, the user's UI will not update to reflect their new permissions or available organizations until they manually refresh the page. This leads to a stale and confusing user experience.
*   **Proposed Fix**: Refactor the membership fetching logic in `useAuth.ts` to use a real-time `onSnapshot` listener on the `members` collection group query. This will ensure that any changes to a user's memberships are pushed to the client instantly.

---

### **Issue #3: Incorrect Staff Management Logic**

*   **File**: `src/components/dashboard/settings/staff-management-tab.tsx`
*   **Problem**: The logic for adding and removing staff members directly modifies the root `/users/{userId}` document's `organizationId` and `roles` fields. This completely bypasses the application's multi-tenant membership model (`/organizations/{orgId}/members/{userId}`).
*   **Impact**: Staff added through this interface will not be correctly associated with the organization, will not be able to switch to it, and their roles will not be applied correctly by the `useAuth` hook, breaking a core architectural principle of the app.
*   **Proposed Fix**: Refactor the `onSubmit` function to create/update a `Membership` document in the organization's `members` subcollection. Refactor `handleRemoveStaff` to delete the corresponding `Membership` document instead of modifying the user document.

---

### **Issue #4: Data Inconsistency in Facility Management**

*   **File**: `src/components/dashboard/settings/facility-management-tab.tsx`
*   **Problem**: The form for creating and editing a facility uses a field named `cost`, but the `Facility` data model and the document creation logic expect a field named `costPerDay`.
*   **Impact**: This will result in facilities being created without a daily cost, causing errors in billing calculations during patient admission and discharge workflows.
*   **Proposed Fix**: In `facility-management-tab.tsx`, rename the `cost` field to `costPerDay` in the Zod form schema (`formSchema`) and update the corresponding `CurrencyInput` component props.
