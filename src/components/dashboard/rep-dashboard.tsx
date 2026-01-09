

import type { User, MedicalRecord } from "@/lib/definitions";
import { MedicalRecordCard } from "./medical-record-card";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function RepDashboard({ user }: { user: User }) {
  const firestore = useFirestore();

  // Show records from a demo patient
  const recordsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'patients', '3049582012', 'medical_records'));
  }, [firestore]);

  const { data: demoRecords } = useCollection<MedicalRecord>(recordsQuery);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Read-Only Access</AlertTitle>
        <AlertDescription>
          As a Marketing Representative, you are viewing sample data for demonstration purposes only.
        </AlertDescription>
      </Alert>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Demo Medical Records</CardTitle>
          <CardDescription>This is an example of how medical records are displayed in the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoRecords && demoRecords.map(record => (
            <MedicalRecordCard key={record.id} record={record} currentUserRole="marketing_rep" patientId="3049582012" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
