

import { medicalRecords, vitalsHistory, patients } from "@/lib/data";
import type { User } from "@/lib/definitions";
import { MedicalRecordCard } from "./medical-record-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { VitalsTracker } from "./vitals-tracker";
import { HealthIdCard } from "./health-id-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, HeartPulse, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RedBanner } from "./red-banner";


export function PatientDashboard({ user }: { user: User }) {
  // In a real app, this would be a DB query. Here, we link patient by name.
  // We'll assume the logged-in patient is 'Karim Ahmed' (patient-1).
  const patient = patients.find(p => p.id === 'patient-1'); // Matching by ID for robustness
  const records = medicalRecords.filter(rec => rec.patientId === patient?.id);

  return (
    <div className="space-y-6">
      <HealthIdCard user={user} />
      
      {patient?.redFlag && (
        <RedBanner
          patientId={patient.id}
          initialRedFlag={patient.redFlag}
          currentUserRole="patient"
        />
      )}
      
      <VitalsTracker 
        vitalsData={vitalsHistory}
        currentUserRole="patient"
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Medical History</CardTitle>
          <CardDescription>Here is a summary of your recent medical records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length > 0 ? (
            records.map(record => (
              <MedicalRecordCard key={record.id} record={record} currentUserRole="patient" />
            ))
          ) : (
            <p className="text-muted-foreground">You have no medical records yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
