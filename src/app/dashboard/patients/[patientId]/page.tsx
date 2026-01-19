

'use client'

import { useAuth } from "@/hooks/use-auth";
import { notFound, useRouter } from "next/navigation";
import { MedicalRecordCard } from "@/components/dashboard/medical-record-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake, Home, Phone, User as UserIcon } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VitalsTracker } from "@/components/dashboard/vitals-tracker";
import { RedBanner } from "@/components/dashboard/red-banner";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import type { Patient, MedicalRecord, Vitals, User } from "@/lib/definitions";
import { AddMedicalRecordDialog } from "@/components/dashboard/add-medical-record-dialog";
import { FormattedDate } from "@/components/shared/formatted-date";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


export default function PatientDetailPage({ params }: { params: { patientId: string } }) {
  const patientId = params.patientId;
  const { user: currentUser, loading: currentUserLoading, hasRole, activeRole } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!currentUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, currentUserLoading, router]);

  const patientUserDocRef = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, "users", patientId);
  }, [firestore, patientId]);

  const { data: patientUser, isLoading: isPatientUserLoading } = useDoc<User>(patientUserDocRef);
  
  const patientDataDocRef = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, "patients", patientId);
  }, [firestore, patientId]);

  const { data: patientData, isLoading: isPatientDataLoading } = useDoc<Patient>(patientDataDocRef);

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
  
  // Effect to log the view action
  useEffect(() => {
    if (
        !firestore ||
        !currentUser ||
        !patientUser ||
        currentUserLoading ||
        isPatientUserLoading
    ) {
        return;
    }

    // Log only if a doctor is viewing another patient's record
    if (hasRole('doctor') && currentUser.id !== patientId) {
        const logRef = collection(firestore, 'patients', patientId, 'privacy_log');
        const logEntry = {
            actorId: currentUser.healthId,
            actorName: currentUser.name,
            actorAvatarUrl: currentUser.avatarUrl,
            patientId: patientId,
            organizationId: currentUser.organizationId,
            action: 'view_record' as const,
            timestamp: serverTimestamp(),
        };

        addDoc(logRef, logEntry)
            .catch(async (serverError) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: logRef.path,
                    operation: 'create',
                    requestResourceData: logEntry,
                }));
            });
    }
  }, [firestore, currentUser, patientUser, currentUserLoading, isPatientUserLoading, hasRole, patientId]);


  const pageIsLoading = currentUserLoading || isPatientUserLoading || isPatientDataLoading || areRecordsLoading || areVitalsLoading;
  
  if (pageIsLoading && !patientUser) {
     return <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-64 w-full" />
    </div>
  }
  
  if (!patientUser) {
    notFound();
  }
  
  // Security check: patients can only see themselves.
  if (!currentUserLoading && hasRole('patient') && activeRole === 'patient') {
    if (currentUser?.id !== patientId) {
        notFound();
    }
  }

  if (pageIsLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-64 w-full" />
    </div>
  }

  if (!currentUser) {
      return null;
  }
  
  const displayName = patientUser.roles.includes('doctor') ? `Dr. ${patientUser.name}` : patientUser.name;

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24">
            <AvatarImage src={patientUser.avatarUrl} />
            <AvatarFallback>{patientUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl">{displayName}</CardTitle>
            <CardDescription className="text-base">Patient Details</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 border-t pt-4">
            <div className="flex items-center gap-2"><Cake className="h-4 w-4 text-muted-foreground" /> <strong>DOB:</strong> <FormattedDate date={patientUser.demographics?.dob} formatString="dd-MM-yyyy" /></div>
            <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> <strong>Gender:</strong> {patientUser.demographics?.gender}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Contact:</strong> {patientUser.demographics?.mobileNumber}</div>
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Address:</strong> {patientUser.demographics?.presentAddress}</div>
          </div>
        </CardContent>
      </Card>
      
      {patientData?.redFlag && (
        <RedBanner 
          patientId={patientId}
          initialRedFlag={patientData.redFlag}
          currentUserRole={activeRole!}
        />
      )}

      {vitalsHistory && <VitalsTracker vitalsData={vitalsHistory} currentUserRole={activeRole!} patientId={patientId} organizationId={patientUser.organizationId} />}

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Medical Records</h2>
            {hasRole('doctor') && (
                <AddMedicalRecordDialog patient={patientUser} doctor={currentUser} />
            )}
        </div>
        <div className="space-y-4">
          {records && records.length > 0 ? (
            records.map(record => (
              <MedicalRecordCard key={record.id} record={record} currentUserRole={activeRole!} patientId={patientId}/>
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
