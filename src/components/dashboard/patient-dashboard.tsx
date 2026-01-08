
import { medicalRecords, vitalsHistory } from "@/lib/data";
import type { User } from "@/lib/definitions";
import { MedicalRecordCard } from "./medical-record-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { VitalsTracker } from "./vitals-tracker";

export function PatientDashboard({ user }: { user: User }) {
  // In a real app, this would be a DB query. Here, we link patient by name.
  // We'll assume the logged-in patient is 'Karim Ahmed' (patient-1).
  const patientId = 'patient-1';
  const records = medicalRecords.filter(rec => rec.patientId === patientId);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
      
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
