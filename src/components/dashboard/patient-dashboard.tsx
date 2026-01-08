

import { medicalRecords, vitalsHistory, patients } from "@/lib/data";
import type { User } from "@/lib/definitions";
import { MedicalRecordCard } from "./medical-record-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { VitalsTracker } from "./vitals-tracker";
import { HealthIdCard } from "./health-id-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, HeartPulse, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HealthAlerts = ({ user }: { user: User }) => {
    // In a real app, patient data would be linked directly to the user.
    // For this mock, we find the corresponding patient record.
    const patient = patients.find(p => p.name === user.name);

    const hasAlerts = patient?.redFlag || (patient?.demographics?.chronicConditions && patient.demographics.chronicConditions.length > 0) || (patient?.demographics?.allergies && patient.demographics.allergies.length > 0);

    if (!hasAlerts) {
        return null;
    }

    return (
        <div className="space-y-4">
             {patient?.redFlag && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>{patient.redFlag.title}</AlertTitle>
                    <AlertDescription>{patient.redFlag.comment}</AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader className="p-4">
                     <CardTitle className="text-lg">Health Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
                    {patient?.demographics.chronicConditions && patient.demographics.chronicConditions.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-semibold flex items-center gap-2 text-sm"><HeartPulse className="h-4 w-4 text-primary"/> Chronic Conditions</h4>
                             <div className="flex flex-wrap gap-2">
                                {patient.demographics.chronicConditions.map(c => <Badge key={c} variant="outline">{c}</Badge>)}
                            </div>
                        </div>
                    )}
                     {patient?.demographics.allergies && patient.demographics.allergies.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-sm"><Siren className="h-4 w-4 text-destructive" /> Allergies</h4>
                             <div className="flex flex-wrap gap-2">
                                {patient.demographics.allergies.map(a => <Badge key={a} variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/20">{a}</Badge>)}
                            </div>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    )
}

export function PatientDashboard({ user }: { user: User }) {
  // In a real app, this would be a DB query. Here, we link patient by name.
  // We'll assume the logged-in patient is 'Karim Ahmed' (patient-1).
  const patient = patients.find(p => p.name === user.name);
  const records = medicalRecords.filter(rec => rec.patientId === patient?.id);

  return (
    <div className="space-y-6">
      <HealthAlerts user={user} />
      <HealthIdCard user={user} />
      
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
