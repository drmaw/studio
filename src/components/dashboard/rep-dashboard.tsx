
'use client';

import type { User, MedicalRecord } from "@/lib/definitions";
import { MedicalRecordCard } from "./medical-record-card";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export function RepDashboard({ user }: { user: User }) {
  const firestore = useFirestore();
  const [demoPatientId, setDemoPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemoPatient = async () => {
      if (!firestore) return;
      // Fetch the dev user to use as a demo patient
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('healthId', '==', '1122334455'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setDemoPatientId(snapshot.docs[0].id);
      }
    };
    fetchDemoPatient();
  }, [firestore]);
  
  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !demoPatientId) return null;
    return query(collection(firestore, 'patients', demoPatientId, 'medical_records'));
  }, [firestore, demoPatientId]);

  const { data: demoRecords, isLoading } = useCollection<MedicalRecord>(recordsQuery);

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
          {isLoading || !demoPatientId ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : demoRecords && demoRecords.length > 0 ? (
            demoRecords.map(record => (
              <MedicalRecordCard key={record.id} record={record} currentUserRole="marketing_rep" patientId={demoPatientId} doctor={user}/>
            ))
          ) : (
            <p className="text-muted-foreground text-center p-8">No demo records found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
