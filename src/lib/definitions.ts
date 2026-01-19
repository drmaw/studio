
import { FieldValue } from "firebase/firestore";

export type Role = 'admin' | 'doctor' | 'patient' | 'marketing_rep' | 'nurse' | 'hospital_owner' | 'lab_technician' | 'pathologist' | 'pharmacist' | 'manager' | 'assistant_manager' | 'front_desk';

export type EmergencyContact = {
    id: string;
    name?: string;
    relation: string;
    contactNumber?: string;
    healthId?: string;
};

export type UserDemographics = {
  dob?: string; // ISO 8601 string
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  fatherName?: string;
  motherName?: string;
  nid?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  presentAddress?: string;
  permanentAddress?: string;
  mobileNumber?: string;
  emergencyContacts?: EmergencyContact[];
  privacySettings?: {
    vitalsVisible: boolean;
    discoverable: boolean;
  };
};

export type User = {
  id: string; // This is the Firebase Auth UID
  healthId: string; // This is the 10-digit user-facing ID
  name: string;
  email: string;
  roles: Role[];
  organizationId: string; // The ACTIVE organization ID
  organizationName?: string; // The ACTIVE organization name
  avatarUrl: string;
  demographics?: UserDemographics;
  isPremium?: boolean;
  status: 'active' | 'suspended';
  createdAt: FieldValue;
  deletionScheduledAt?: FieldValue | null;
};

export type Patient = {
  chronicConditions?: string[];
  allergies?: string[];
  redFlag?: {
    title: string;
    comment: string;
  };
  createdAt: FieldValue;
};

export type Organization = {
  id: string;
  name: string;
  address?: string;
  registrationNumber?: string;
  tin?: string;
  mobileNumber?: string;
  ownerId: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: FieldValue;
  facilityImages?: string[];
};

export type Membership = {
    id: string;
    userId: string;
    userName: string;
    roles: Role[];
    status: 'active' | 'pending' | 'inactive';
};

export type DetailedMembership = Membership & {
    orgId: string;
    orgName: string;
};

export type MedicalRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  date: string; // ISO String
  diagnosis: string;
  notes: string;
  createdAt: FieldValue;
};

export type RecordFile = {
  id: string;
  name: string;
  fileType: 'image' | 'pdf';
  recordType: 'prescription' | 'report';
  url: string;
  size: string;
  uploadedBy: string; // User ID
  uploaderName: string;
  patientId: string;
  organizationId: string;
  createdAt: FieldValue;
};

export type Vitals = {
  id: string;
  patientId: string;
  organizationId: string;
  date: string; // ISO 8601 string
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  weight: number | null;
  rbs: number | null;
  sCreatinine: number | null;
  createdAt: FieldValue;
};

export type PrivacyLogEntry = {
    id: string;
    actorId: string;
    actorName: string;
    actorAvatarUrl: string;
    patientId: string;
    organizationId: string;
    action: 'search' | 'view_record' | 'add_record' | 'edit_record' | 'update_red_flag' | 'remove_red_flag';
    timestamp: FieldValue; // ISO 8601 string
};

export type RoleApplication = {
  id: string;
  userId: string;
  userName: string;
  requestedRole: Role;
  status: 'pending' | 'approved' | 'rejected';
  details: any; // Can be doctor details, hospital details, etc.
  reason?: string; // Optional reason for rejection
  createdAt: FieldValue;
  reviewedAt?: FieldValue;
};

export type RoleRemovalRequest = {
  id: string;
  userId: string;
  userName: string;
  roleToRemove: Role;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: FieldValue;
  reviewedAt?: FieldValue;
};

export type Day = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export type DoctorSchedule = {
  id: string;
  doctorId: string; // This is the public Health ID
  doctorAuthId: string; // This is the Firebase Auth UID
  doctorName: string;
  organizationId: string;
  organizationName: string;
  roomNumber: string;
  fee: number;
  days: Day[];
  startTime: string; // "HH:MM" 24hr format
  endTime: string; // "HH:MM" 24hr format
  createdAt: FieldValue;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  organizationName: string;
  scheduleId: string;
  appointmentDate: string; // "YYYY-MM-DD"
  appointmentTime: string; // e.g. "05:00 PM"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  createdAt: FieldValue;
};

export type FeeItem = {
  id: string;
  organizationId: string;
  category: 'investigation' | 'admission' | 'doctor_fee' | 'procedure';
  name: string;
  cost: number;
  createdAt: FieldValue;
};

export type Facility = {
  id: string;
  organizationId: string;
  type: 'ward' | 'cabin';
  name: string;
  beds: number;
  cost: number;
  createdAt: FieldValue;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  description: string;
  href?: string;
  isRead: boolean;
  createdAt: FieldValue;
};
