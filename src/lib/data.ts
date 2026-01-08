

import type { User, Patient, MedicalRecord, Vitals } from '@/lib/definitions';

export const users: User[] = [
  { 
    id: '8912409021', 
    name: 'Dr. Anika Rahman', 
    email: 'doctor@digihealth.com', 
    roles: ['doctor', 'patient'], 
    avatarUrl: 'https://picsum.photos/seed/doc1/100/100',
    demographics: {
      dob: '1982-08-12T00:00:00.000Z',
      gender: 'Female',
      contact: '+8801711223344',
      mobileNumber: '+8801711223344',
      fatherName: "Mr. Doctor Father",
      motherName: "Mrs. Doctor Mother",
      nid: "19821234567890123",
      bloodGroup: 'O+',
      presentAddress: "123 Health St, Medical Road, Dhaka, Bangladesh",
      permanentAddress: "456 Village Rd, Health District, Country",
      allergies: ['Pollen'],
      chronicConditions: ['Hypertension'],
    },
    isPremium: true
  },
  { 
    id: '3049582012', 
    name: 'Karim Ahmed', 
    email: 'patient@digihealth.com', 
    roles: ['patient'], 
    avatarUrl: 'https://picsum.photos/seed/pat1/100/100',
    demographics: {
      dob: '1990-05-20T00:00:00.000Z',
      gender: 'Male',
      contact: '+8801712345678',
      mobileNumber: '+8801712345678',
      fatherName: "Mr. Patient Father",
      motherName: "Mrs. Patient Mother",
      nid: "19901234567890123",
      bloodGroup: 'A+',
      presentAddress: "789 Patient Ave, Wellness City, Dhaka",
      permanentAddress: "101 Native Town, Home District, Country",
      allergies: ['Dust', 'Penicillin'],
      chronicConditions: ['Asthma', 'Diabetes'],
    },
    isPremium: false
  },
  { 
    id: '1234567890', 
    name: 'Salma Khan', 
    email: 'rep@digihealth.com', 
    roles: ['marketing_rep', 'patient'], 
    avatarUrl: 'https://picsum.photos/seed/rep1/100/100',
    demographics: { dob: '1995-02-10T00:00:00.000Z', gender: 'Female', mobileNumber: '+8801987654321', allergies: [], chronicConditions: [] },
    isPremium: false
  },
  { 
    id: '0987654321', 
    name: 'Dr. Farid Uddin', 
    email: 'doctor2@digihealth.com', 
    roles: ['doctor', 'patient'], 
    avatarUrl: 'https://picsum.photos/seed/doc2/100/100',
    demographics: { dob: '1975-11-30T00:00:00.000Z', gender: 'Male', mobileNumber: '+8801654321987', allergies: [], chronicConditions: ['Hypertension'] },
    isPremium: true
  },
  { 
    id: '1122334455', 
    name: 'Admin Owner', 
    email: 'owner@digihealth.com', 
    roles: ['hospital_owner', 'patient'], 
    avatarUrl: 'https://picsum.photos/seed/owner1/100/100',
    demographics: { dob: '1970-01-01T00:00:00.000Z', gender: 'Male', mobileNumber: '+8801512345678', allergies: [], chronicConditions: [] },
    isPremium: true
  }
];

export const patients: Patient[] = [
  { 
    id: 'patient-1', 
    name: 'Karim Ahmed',
    demographics: { 
      dob: '1985-05-20', 
      gender: 'Male', 
      contact: '+8801712345678', 
      address: '123 Gulshan, Dhaka',
      chronicConditions: ['Asthma', 'Diabetes'],
      allergies: ['Dust', 'Penicillin']
    }
  },
  { 
    id: 'patient-2', 
    name: 'Fatima Begum',
    demographics: { 
      dob: '1992-11-15', 
      gender: 'Female', 
      contact: '+8801812345679', 
      address: '456 Banani, Dhaka',
      chronicConditions: ['Hypertension'],
      allergies: []
    }
  },
  {
    id: 'patient-3',
    name: 'Rashedul Islam',
    demographics: { 
      dob: '1978-01-30', 
      gender: 'Male', 
      contact: '+8801912345680', 
      address: '789 Dhanmondi, Dhaka',
      chronicConditions: [],
      allergies: ['Shellfish']
    },
    redFlag: {
      title: 'Severe Shellfish Allergy',
      comment: 'Patient has a history of anaphylaxis in response to shellfish. Epinephrine auto-injector must be available if any seafood is administered.'
    }
  }
];

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'rec-1',
    patientId: 'patient-1',
    doctorId: '8912409021',
    doctorName: 'Dr. Anika Rahman',
    date: '2024-05-10',
    diagnosis: 'Common Cold',
    notes: 'Prescribed rest and hydration. Advised to take paracetamol for fever. Follow-up in 3 days if symptoms persist.'
  },
  {
    id: 'rec-2',
    patientId: 'patient-1',
    doctorId: '8912409021',
    doctorName: 'Dr. Anika Rahman',
    date: '2023-11-22',
    diagnosis: 'Seasonal Allergies',
    notes: 'Patient presented with sneezing, runny nose, and itchy eyes. Prescribed antihistamines.'
  },
  {
    id: 'rec-3',
    patientId: 'patient-2',
    doctorId: '0987654321',
    doctorName: 'Dr. Farid Uddin',
    date: '2024-04-01',
    diagnosis: 'Hypertension',
    notes: 'Blood pressure reading: 145/95 mmHg. Advised lifestyle changes including diet and exercise. Prescribed Amlodipine 5mg once daily.'
  },
  {
    id: 'rec-4',
    patientId: 'patient-3',
    doctorId: '8912409021',
    doctorName: 'Dr. Anika Rahman',
    date: '2024-06-15',
    diagnosis: 'Type 2 Diabetes',
    notes: 'Fasting blood sugar is high. Started on Metformin 500mg twice daily. Patient counseled on diet and importance of regular monitoring.'
  }
];

export const vitalsHistory: Vitals[] = [
  { id: 'v1', date: '2024-07-20T08:00:00.000Z', bpSystolic: 125, bpDiastolic: 82, pulse: 70, weight: 75, rbs: null },
  { id: 'v2', date: '2024-07-21T08:15:00.000Z', bpSystolic: 122, bpDiastolic: 80, pulse: 68, weight: 75.2, rbs: 5.5 },
  { id: 'v3', date: '2024-07-22T08:05:00.000Z', bpSystolic: 128, bpDiastolic: 85, pulse: 75, weight: 75.1, rbs: null },
  { id: 'v4', date: '2024-07-23T09:00:00.000Z', bpSystolic: 120, bpDiastolic: 78, pulse: 65, weight: 74.8, rbs: 5.8 },
  { id: 'v5', date: '2024-07-24T08:30:00.000Z', bpSystolic: 124, bpDiastolic: 81, pulse: 72, weight: 74.9, rbs: null },
  { id: 'v6', date: '2024-07-25T08:00:00.000Z', bpSystolic: 126, bpDiastolic: 83, pulse: 71, weight: 75.0, rbs: 5.6 },
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

    