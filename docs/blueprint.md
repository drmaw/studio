# **App Name**: Digi Health

## Core Features:

- User Authentication: Firebase Authentication for user registration, login, and role management (doctor, patient, marketing_rep). Roles are stored in Firestore.
- Role-Based Dashboards: Separate dashboards for doctors (add/edit notes), patients (read-only records), and marketing representatives (demo data, read-only).
- Patient Record Management: Doctors can view, add, and edit patient medical records. Patients can view their own records only.
- Profile and Settings: Basic user profile information and logout functionality.
- Data Storage: Store user roles, patient demographics, and medical records in Firestore.
- Access Control: Enforce role-based access to data and functionality via Firestore security rules.
- Landing Page: Introductory page with login and registration options.

## Style Guidelines:

- Background color: Light gray (#F5F5F5) for a clean and professional feel.
- Primary color: Light blue (#ADD8E6), evoking a sense of calmness and trust, for main elements and buttons.
- Accent color: A slightly darker shade of blue (#77B5FE) for interactive elements and highlights to maintain visual hierarchy.
- Body and headline font: 'PT Sans' (sans-serif) for a modern, readable, and neutral look.
- Use simple, clean icons from a set like Font Awesome or Material Design Icons.
- Clean, minimal layouts with clear sections for data presentation and navigation.
- Subtle transitions and animations to improve user experience without being distracting.