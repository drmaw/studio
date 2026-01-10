import { FieldValue } from "firebase/firestore";

export type Role = 'doctor' | 'patient' | 'marketing_rep' | 'nurse' | 'hospital_owner' | 'lab_technician' | 'pathologist' | 'pharmacist' | 'manager' | 'assistant_manager' | 'front_desk';

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
  contact?: string;
  fatherName?: string;
  motherName?: string;
  nid?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  presentAddress?: string;
  permanentAddress?: string;
  mobileNumber?: string;
  chronicConditions?: string[];
  allergies?: string[];
  emergencyContacts?: EmergencyContact[];
};

export type User = {
  id: string; // This is the Firebase Auth UID
  healthId: string; // This is the 10-digit user-facing ID
  name: string;
  email: string;
  roles: Role[];
  organizationId: string;
  avatarUrl: string;
  demographics?: UserDemographics;
  isPremium?: boolean;
  createdAt: FieldValue;
};

export type Patient = {
  id: string; // This is the Firebase Auth UID
  healthId: string; // This is the 10-digit user-facing ID
  name: string;
  userId: string;
  organizationId: string;
  demographics: {
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    address: string;
  };
  chronicConditions?: string[];
  allergies?: string[];
  redFlag?: {
    title: string;
    comment: string;
  };
  createdAt: FieldValue;
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
    action: 'search' | 'view_record' | 'add_record';
    timestamp: FieldValue; // ISO 8601 string
};