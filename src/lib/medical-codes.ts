export type MedicalCode = {
  code: string;
  description: string;
};

export const icd10Codes: MedicalCode[] = [
  { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  { code: "I10", description: "Essential (primary) hypertension" },
  { code: "J02.9", description: "Acute pharyngitis, unspecified" },
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
  { code: "J18.9", description: "Pneumonia, unspecified organism" },
  { code: "J45.9", description: "Asthma, unspecified" },
  { code: "K29.7", description: "Gastritis, unspecified" },
  { code: "M54.5", description: "Low back pain" },
  { code: "R05", description: "Cough" },
  { code: "R42", description: "Dizziness and giddiness" },
  { code: "R51", description: "Headache" },
];
