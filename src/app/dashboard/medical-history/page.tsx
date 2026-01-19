
'use client'

import { useAuth } from "@/hooks/use-auth";
import { MedicalRecordCard } from "@/components/dashboard/medical-record-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ScrollText } from "lucide-react";
import { useFirestore } from "@/firebase";
import { query, collectionGroup, where, orderBy, getDocs, limit, startAfter, type DocumentSnapshot } from "firebase/firestore";
import type { MedicalRecord } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 5;

export default function MedicalHistoryPage() {
  const { user: currentUser, loading: currentUserLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchRecords = async (loadMore = false) => {
    if (!currentUser || !firestore) return;

    if(loadMore) setIsLoadingMore(true); else setIsLoading(true);

    let q;
    const baseQuery = [
        collectionGroup(firestore, 'records'),
        where('patientId', '==', currentUser.id),
        orderBy('createdAt', 'desc'),
    ];

    if (loadMore && lastVisible) {
        q = query(...baseQuery, startAfter(lastVisible), limit(PAGE_SIZE));
    } else {
        q = query(...baseQuery, limit(PAGE_SIZE));
    }

    try {
        const documentSnapshots = await getDocs(q);
        const newRecords = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));
        
        setHasMore(newRecords.length === PAGE_SIZE);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        setRecords(prev => loadMore ? [...prev, ...newRecords] : newRecords);
    } catch (error) {
        console.error("Error fetching medical history: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch medical history." });
    } finally {
        if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && firestore) {
      fetchRecords();
    }
  }, [currentUser, firestore]);

  const pageIsLoading = currentUserLoading || isLoading;

  if (pageIsLoading && records.length === 0) {
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
        ) : !pageIsLoading ? (
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
        ) : null}
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {hasMore && !pageIsLoading && (
        <div className="mt-6 flex justify-center">
            <Button onClick={() => fetchRecords(true)} disabled={isLoadingMore}>
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
            </Button>
        </div>
      )}
    </div>
  );
}
