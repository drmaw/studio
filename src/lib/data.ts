
import type { User, Patient, MedicalRecord, Vitals } from '@/lib/definitions';

export const users: User[] = [
  { id: 'user-doc-1', name: 'Dr. Anika Rahman', email: 'doctor@digihealth.com', role: 'doctor', avatarUrl: 'https://picsum.photos/seed/doc1/100/100' },
  { id: 'user-pat-1', name: 'Karim Ahmed', email: 'patient@digihealth.com', role: 'patient', avatarUrl: 'https://picsum.photos/seed/pat1/100/100' },
  { id: 'user-rep-1', name: 'Salma Khan', email: 'rep@digihealth.com', role: 'marketing_rep', avatarUrl: 'https://picsum.photos/seed/rep1/100/100' },
  { id: 'user-doc-2', name: 'Dr. Farid Uddin', email: 'doctor2@digihealth.com', role: 'doctor', avatarUrl: 'https://picsum.photos/seed/doc2/100/100' },
  { id: 'user-owner-1', name: 'Admin Owner', email: 'owner@digihealth.com', role: 'hospital_owner', avatarUrl: 'https://picsum.photos/seed/owner1/100/100' }
];

export const patients: Patient[] = [
  { 
    id: 'patient-1', 
    name: 'Karim Ahmed',
    demographics: { dob: '1985-05-20', gender: 'Male', contact: '+8801712345678', address: '123 Gulshan, Dhaka' }
  },
  { 
    id: 'patient-2', 
    name: 'Fatima Begum',
    demographics: { dob: '1992-11-15', gender: 'Female', contact: '+8801812345679', address: '456 Banani, Dhaka' }
  },
  {
    id: 'patient-3',
    name: 'Rashedul Islam',
    demographics: { dob: '1978-01-30', gender: 'Male', contact: '+8801912345680', address: '789 Dhanmondi, Dhaka' }
  }
];

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'rec-1',
    patientId: 'patient-1',
    doctorId: 'user-doc-1',
    doctorName: 'Dr. Anika Rahman',
    date: '2024-05-10',
    diagnosis: 'Common Cold',
    notes: 'Prescribed rest and hydration. Advised to take paracetamol for fever. Follow-up in 3 days if symptoms persist.'
  },
  {
    id: 'rec-2',
    patientId: 'patient-1',
    doctorId: 'user-doc-1',
    doctorName: 'Dr. Anika Rahman',
    date: '2023-11-22',
    diagnosis: 'Seasonal Allergies',
    notes: 'Patient presented with sneezing, runny nose, and itchy eyes. Prescribed antihistamines.'
  },
  {
    id: 'rec-3',
    patientId: 'patient-2',
    doctorId: 'user-doc-2',
    doctorName: 'Dr. Farid Uddin',
    date: '2024-04-01',
    diagnosis: 'Hypertension',
    notes: 'Blood pressure reading: 145/95 mmHg. Advised lifestyle changes including diet and exercise. Prescribed Amlodipine 5mg once daily.'
  },
  {
    id: 'rec-4',
    patientId: 'patient-3',
    doctorId: 'user-doc-1',
    doctorName: 'Dr. Anika Rahman',
    date: '2024-06-15',
    diagnosis: 'Type 2 Diabetes',
    notes: 'Fasting blood sugar is high. Started on Metformin 500mg twice daily. Patient counseled on diet and importance of regular monitoring.'
  }
];

export const vitalsHistory: Vitals[] = [
  { id: 'v1', date: '2024-07-20 08:00', bpSystolic: 125, bpDiastolic: 82, pulse: 70, weight: 75, rbs: null },
  { id: 'v2', date: '2024-07-21 08:15', bpSystolic: 122, bpDiastolic: 80, pulse: 68, weight: 75.2, rbs: 5.5 },
  { id: 'v3', date: '2024-07-22 08:05', bpSystolic: 128, bpDiastolic: 85, pulse: 75, weight: 75.1, rbs: null },
  { id: 'v4', date: '2024-07-23 09:00', bpSystolic: 120, bpDiastolic: 78, pulse: 65, weight: 74.8, rbs: 5.8 },
  { id: 'v5', date: '2024-07-24 08:30', bpSystolic: 124, bpDiastolic: 81, pulse: 72, weight: 74.9, rbs: null },
  { id: 'v6', date: '2024-07-25 08:00', bpSystolic: 126, bpDiastolic: 83, pulse: 71, weight: 75.0, rbs: 5.6 },
];

// Demo data for marketing rep
export const demoRecords: MedicalRecord[] = [
  {
    id: 'demo-rec-1',
    patientId: 'demo-patient-1',
    doctorId: 'demo-doc-1',
    doctorName: 'Dr. Demo',
    date: '2024-01-15',
    diagnosis: 'Example Diagnosis A',
    notes: 'This is a sample medical note for demonstration purposes. No real patient data is used here.'
  },
  {
    id: 'demo-rec-2',
    patientId: 'demo-patient-2',
    doctorId: 'demo-doc-1',
    doctorName: 'Dr. Demo',
    date: '2024-02-20',
    diagnosis: 'Example Diagnosis B',
    notes: 'This note illustrates the structure of a medical record within the Digi Health system.'
  }
];
