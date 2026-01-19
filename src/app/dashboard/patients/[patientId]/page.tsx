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
import { useDoc, useCollection, useFirestore, useMemoFirebase, addDocument, useCollectionGroup } from "@/firebase";
import { doc, collection, query, orderBy, serverTimestamp, collectionGroup, where } from "firebase/firestore";
import type { Patient, MedicalRecord, Vitals, User } from "@/lib/definitions";
import { AddMedicalRecordDialog } from "@/components/dashboard/add-medical-record-dialog";
import { FormattedDate } from "@/components/shared/formatted-date";
import { OrderTestDialog } from "@/components/dashboard/lab/order-test-dialog";


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
    if (!firestore || !patientId || !currentUser) return null;

    // If patient is viewing their own records, query all records for them using a collection group query
    if (currentUser.id === patientId) {
        return query(
            collectionGroup(firestore, 'records'),
            where('patientId', '==', patientId),
            orderBy('createdAt', 'desc')
        );
    }
    
    // If a doctor is viewing, scope records to their active organization.
    if (hasRole('doctor') && currentUser.organizationId) {
        return query(
            collection(firestore, "organizations", currentUser.organizationId, "medical_records", patientId, "records"), 
            orderBy("createdAt", "desc")
        );
    }

    return null;
  }, [firestore, patientId, currentUser, hasRole]);
  
  // Use useCollection for single-collection queries and useCollectionGroup for group queries
  const { data: singleOrgRecords, isLoading: singleOrgRecordsLoading } = useCollection<MedicalRecord>(recordsQuery && recordsQuery.type !== 'collection-group' ? recordsQuery : null);
  const { data: allOrgRecords, isLoading: allOrgRecordsLoading } = useCollectionGroup<MedicalRecord>(recordsQuery && recordsQuery.type === 'collection-group' ? recordsQuery : null);

  const records = currentUser?.id === patientId ? allOrgRecords : singleOrgRecords;
  const areRecordsLoading = currentUser?.id === patientId ? allOrgRecordsLoading : singleOrgRecordsLoading;

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

    // Log only if a doctor is viewing another patient's record and has an active org
    if (hasRole('doctor') && currentUser.id !== patientId && currentUser.organizationId) {
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

        addDocument(logRef, logEntry, undefined, (error) => {
            console.error("Failed to write privacy log for record view:", error);
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
  
  // Security check: non-doctors can only see themselves.
  if (!currentUserLoading && !hasRole('doctor')) {
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
  
  const displayName = patientUser.name;
  const headingText = currentUser.id === patientId ? 'Your Medical History' : `Medical Records at ${currentUser.organizationName || 'this organization'}`;

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

      {vitalsHistory && <VitalsTracker vitalsData={vitalsHistory} currentUserRole={activeRole!} patientId={patientId} organizationId={currentUser.organizationId} />}

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{headingText}</h2>
            {hasRole('doctor') && (
                <div className="flex gap-2">
                    <OrderTestDialog patient={patientUser} doctor={currentUser} />
                    <AddMedicalRecordDialog patient={patientUser} doctor={currentUser} />
                </div>
            )}
        </div>
        <div className="space-y-4">
          {records && records.length > 0 ? (
            records.map(record => (
              <MedicalRecordCard key={record.id} record={record} currentUserRole={activeRole!} patientId={patientId} doctor={currentUser}/>
            ))
          ) : (
            <Card className="flex items-center justify-center p-8 bg-background-soft">
                <p className="text-muted-foreground">
                  {currentUser.id === patientId ? "You have no medical records yet." : `No medical records found for this patient at ${currentUser.organizationName || 'this organization'}.`}
                </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
