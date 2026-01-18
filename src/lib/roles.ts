
import type { Role } from './definitions';
import { Stethoscope, UserCog, UserCheck, FlaskConical, Microscope, Pill, Briefcase } from "lucide-react";

export const professionalRolesConfig: Partial<Record<Role, { label: string, icon: React.ElementType, description: string }>> = {
    doctor: { label: 'Doctor', icon: Stethoscope, description: 'Manage patient care, diagnose, and prescribe.' },
    hospital_owner: { label: 'Hospital Owner', icon: UserCog, description: 'Oversee all hospital operations and settings.' },
    nurse: { label: 'Nurse', icon: UserCheck, description: 'Manage patient care, vitals, and notes.' },
    lab_technician: { label: 'Lab Technician', icon: FlaskConical, description: 'Manage lab tests, samples, and results.' },
    pathologist: { label: 'Pathologist', icon: Microscope, description: 'Analyze samples and prepare pathology reports.' },
    pharmacist: { label: 'Pharmacist', icon: Pill, description: 'Manage pharmacy inventory and dispense medication.' },
    manager: { label: 'Manager', icon: Briefcase, description: 'Oversee hospital operations, staff, and reporting.' },
    assistant_manager: { label: 'Asst. Manager', icon: Briefcase, description: 'Assist in overseeing hospital operations.' },
    front_desk: { label: 'Front Desk', icon: Briefcase, description: 'Manage patient check-in, appointments, and inquiries.' },
    marketing_rep: { label: 'Marketing Rep', icon: Briefcase, description: 'Demonstrate application features.' },
};

export const professionalRoleHierarchy: Role[] = [
    'hospital_owner', 
    'manager', 
    'assistant_manager', 
    'doctor', 
    'nurse', 
    'pharmacist', 
    'lab_technician', 
    'pathologist', 
    'front_desk', 
    'marketing_rep'
];

export const allRoleHierarchy: Role[] = [
    'admin',
    ...professionalRoleHierarchy,
    'patient',
];

// Roles that can be assigned to staff by a hospital owner
export const staffRoles: Role[] = [
    'doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'
];

// Roles that a user can apply for
export const applicationRoles: Role[] = [
    'doctor', 'nurse', 'hospital_owner'
];
