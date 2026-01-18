

'use client';

import type { RecordFile, User, Patient, Vitals } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { VitalsTracker } from "./vitals-tracker";
import { HealthIdCard } from "./health-id-card";
import { RedBanner } from "./red-banner";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, FileText } from "lucide-react";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, orderBy, query, limit } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";


function LatestRecordCard({ record }: { record: RecordFile }) {
    return (
        <Card className="flex flex-col sm:flex-row bg-background">
            <div className="sm:w-1/3">
                 {record.fileType === 'image' ? (
                    <Image src={record.url} alt={record.name} width={400} height={300} className="w-full h-48 sm:h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-r-none" />
                ) : (
                    <div className="w-full h-48 sm:h-full bg-secondary flex flex-col items-center justify-center text-center p-4 rounded-t-lg sm:rounded-l-lg sm:rounded-r-none">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1">
                <CardHeader>
                    <CardTitle>{record.name}</CardTitle>
                    <CardDescription>
                       Uploaded by {record.uploaderName} on {record.createdAt ? format(new Date((record.createdAt as any).toDate()), "dd-MM-yyyy") : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Badge variant={record.fileType === 'pdf' ? 'destructive' : 'secondary'}>{record.fileType.toUpperCase()}</Badge>
                        <Badge variant="outline" className="capitalize">{record.recordType}</Badge>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto">
                     <Button asChild variant="outline">
                        <Link href="/dashboard/my-records">
                            View More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </div>
        </Card>
    )
}


export function PatientDashboard({ user }: { user: User }) {
  const { loading } = useAuth();
  const firestore = useFirestore();

  const patientDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return doc(firestore, 'patients', user.id);
  }, [firestore, user?.id]);

  const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientDocRef);

  const recordsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(
        collection(firestore, 'patients', user.id, 'record_files'),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
  }, [firestore, user?.id]);

  const { data: latestRecords, isLoading: areRecordsLoading } = useCollection<RecordFile>(recordsQuery);
  const recordToShow = latestRecords?.[0];

  const vitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(
      collection(firestore, 'patients', user.id, 'vitals'),
      orderBy('date', 'desc')
    );
  }, [firestore, user?.id]);

  const { data: vitalsHistory, isLoading: areVitalsLoading } = useCollection<Vitals>(vitalsQuery);

  const pageIsLoading = loading || isPatientLoading || areRecordsLoading || areVitalsLoading;

  if (pageIsLoading) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && <HealthIdCard user={user} patient={patient} />}
      
      {patient?.redFlag && (
        <RedBanner
          patientId={patient.id}
          initialRedFlag={patient.redFlag}
          currentUserRole="patient"
        />
      )}
      
      {vitalsHistory && (
        <VitalsTracker 
            vitalsData={vitalsHistory}
            currentUserRole="patient"
            patientId={user.id}
            organizationId={user.organizationId}
        />
      )}

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Your Medical History</CardTitle>
          <CardDescription>Here is your most recently uploaded document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recordToShow ? (
            <LatestRecordCard record={recordToShow} />
          ) : (
            <p className="text-muted-foreground text-center p-8">You have no medical records yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    
