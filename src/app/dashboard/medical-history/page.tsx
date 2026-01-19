
'use client'

import { useAuth } from "@/hooks/use-auth";
import { MedicalRecordCard } from "@/components/dashboard/medical-record-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ScrollText } from "lucide-react";
import { useCollectionGroup, useFirestore, useMemoFirebase } from "@/firebase";
import { query, collectionGroup, where, orderBy } from "firebase/firestore";
import type { MedicalRecord } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";


export default function MedicalHistoryPage() {
  const { user: currentUser, loading: currentUserLoading } = useAuth();
  const firestore = useFirestore();

  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;

    return query(
        collectionGroup(firestore, 'records'),
        where('patientId', '==', currentUser.id),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, currentUser]);
  
  const { data: records, isLoading: areRecordsLoading } = useCollectionGroup<MedicalRecord>(recordsQuery);

  const pageIsLoading = currentUserLoading || areRecordsLoading;

  if (pageIsLoading) {
    return (
        <div className="space-y-6">
            <div className="h-10 w-1/2 bg-muted rounded-md animate-pulse" />
            <div className="h-40 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-40 w-full bg-muted rounded-md animate-pulse" />
        </div>
    )
  }

  if (!currentUser) {
      return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={<><ScrollText className="h-8 w-8" /> Medical History</>}
        description="A complete, chronological timeline of your medical records from all organizations."
      />
      <div className="space-y-4">
        {records && records.length > 0 ? (
        records.map(record => (
            <MedicalRecordCard key={record.id} record={record} currentUserRole="patient" patientId={currentUser.id} doctor={currentUser}/>
        ))
        ) : (
            <Card>
                <CardContent className="p-0">
                    <EmptyState 
                        icon={ScrollText}
                        message="No Medical Records Found"
                        description="Your medical history from across all organizations will appear here."
                        className="py-16"
                    />
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
