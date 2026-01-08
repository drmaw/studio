

export type Role = 'doctor' | 'patient' | 'marketing_rep' | 'nurse' | 'hospital_owner' | 'lab_technician' | 'pathologist' | 'pharmacist' | 'manager' | 'assistant_manager' | 'front_desk';

export type User = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
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

export type Vitals = {
  id: string;
  date: string; // "YYYY-MM-DD HH:mm"
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  weight: number | null;
  rbs: number | null;
};
