export type Role = 'doctor' | 'patient' | 'marketing_rep' | 'nurse' | 'hospital_owner';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
};

export type Patient = {
  id: string;
  name: string;
  demographics: {
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    address: string;
  };
};

export type MedicalRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  notes: string;
};
