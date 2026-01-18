

'use client'

import { useAuth } from "@/hooks/use-auth";
import { notFound, useRouter } from "next/navigation";
import { MedicalRecordCard } from "@/components/dashboard/medical-record-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake, Home, Phone, User as UserIcon } from "lucide-react";
import { useEffect, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VitalsTracker } from "@/components/dashboard/vitals-tracker";
import { RedBanner } from "@/components/dashboard/red-banner";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import type { Patient, MedicalRecord, Vitals } from "@/lib/definitions";


export default function PatientDetailPage({ params }: { params: { patientId: string } }) {
  const patientId = params.patientId;
  const { user, loading, hasRole, activeRole } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const patientDocRef = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, "patients", patientId);
  }, [firestore, patientId]);

  const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientDocRef);

  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return query(collection(firestore, "patients", patientId, "medical_records"), orderBy("createdAt", "desc"));
  }, [firestore, patientId]);
  
  const { data: records, isLoading: areRecordsLoading } = useCollection<MedicalRecord>(recordsQuery);

  const vitalsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return query(collection(firestore, "patients", patientId, "vitals"), orderBy("date", "desc"));
  }, [firestore, patientId]);

  const { data: vitalsHistory, isLoading: areVitalsLoading } = useCollection<Vitals>(vitalsQuery);

  if (isPatientLoading && !patient) {
     return <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-64 w-full" />
    </div>
  }
  
  if (!patient) {
    notFound();
  }
  
  // Security check: only doctors can see any patient, patients can only see themselves.
  if (!loading && hasRole('patient') && activeRole === 'patient') {
    if (user?.id !== patient.userId) {
        notFound();
    }
  }

  const pageIsLoading = loading || isPatientLoading || areRecordsLoading || areVitalsLoading || !user;

  if (pageIsLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-64 w-full" />
    </div>
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24">
            <AvatarImage src={`https://picsum.photos/seed/${patient.id}/100/100`} />
            <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription className="text-base">Patient Details</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 border-t pt-4">
            <div className="flex items-center gap-2"><Cake className="h-4 w-4 text-muted-foreground" /> <strong>DOB:</strong> {patient.demographics.dob}</div>
            <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> <strong>Gender:</strong> {patient.demographics.gender}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Contact:</strong> {patient.demographics.contact}</div>
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Address:</strong> {patient.demographics.address}</div>
          </div>
        </CardContent>
      </Card>
      
      {patient.redFlag && (
        <RedBanner 
          patientId={patient.id}
          initialRedFlag={patient.redFlag}
          currentUserRole={activeRole!}
        />
      )}

      {vitalsHistory && <VitalsTracker vitalsData={vitalsHistory} currentUserRole={activeRole!} patientId={patient.id} organizationId={patient.organizationId} />}

      <div>
        <h2 className="text-2xl font-bold mb-4">Medical Records</h2>
        <div className="space-y-4">
          {records && records.length > 0 ? (
            records.map(record => (
              <MedicalRecordCard key={record.id} record={record} currentUserRole={activeRole!} patientId={patient.id}/>
            ))
          ) : (
            <Card className="flex items-center justify-center p-8 bg-background-soft">
                <p className="text-muted-foreground">No medical records found for this patient.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
