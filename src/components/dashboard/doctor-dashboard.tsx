
'use client'

import type { User, DoctorSchedule } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, QrCode, UserX, Loader2, Hospital, Clock } from "lucide-react";
import { Input } from "../ui/input";
import { useCollectionGroup, useFirestore, useMemoFirebase } from "@/firebase";
import { Skeleton } from "../ui/skeleton";
import { collectionGroup, query, where } from "firebase/firestore";
import { PageHeader } from "../shared/page-header";
import { QrScannerDialog } from "./qr-scanner-dialog";
import { usePatientSearch } from "@/hooks/use-patient-search";
import { EmptyState } from "../shared/empty-state";
import { PatientInfoCard } from "../shared/patient-info-card";

export function DoctorDashboard({ user }: { user: User }) {
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResult,
    handleSearch,
  } = usePatientSearch();

  const firestore = useFirestore();

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collectionGroup(firestore, 'schedules'), where('doctorAuthId', '==', user.id));
  }, [firestore, user]);
  
  const { data: chamberSchedules, isLoading: schedulesLoading } = useCollectionGroup<DoctorSchedule>(schedulesQuery);

  if (!user) {
      return null;
  }
  
  const displayName = user.name;

  return (
    <div className="space-y-8">
      <PageHeader
        title={<>Welcome, <span className="text-primary">Dr. {displayName}</span></>}
        description="Search for patients and manage your chamber schedules."
      />

      {/* Patient Search */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>Find a patient by their Health ID or mobile number.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter Health ID or Mobile Number..." 
                      className="pl-8" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <QrScannerDialog onScan={(id) => handleSearch(id)}>
                    <Button variant="outline" size="icon">
                        <QrCode className="h-5 w-5"/>
                        <span className="sr-only">Scan QR</span>
                    </Button>
                </QrScannerDialog>
                <Button onClick={() => handleSearch()} disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin" /> : "Search"}
                </Button>
            </div>
            
            <div className="mt-6">
              {isSearching ? (
                 <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                 </div>
              ) : searchResult === 'not_found' ? (
                 <EmptyState
                    icon={UserX}
                    message="No Patient Found"
                    description="No patient record matches the provided ID or mobile number."
                 />
              ) : searchResult ? (
                <PatientInfoCard 
                    patient={searchResult}
                    actionSlot={
                        <Button asChild variant="default" size="sm">
                            <Link href={`/dashboard/patients/${searchResult.id}`}>
                            View Full Records <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    }
                />
              ) : null}
            </div>
        </CardContent>
      </Card>
      
      {/* Chambers Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Hospital />
          Your Chambers
        </h2>
        {schedulesLoading ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : chamberSchedules && chamberSchedules.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chamberSchedules.map((schedule) => (
                    <Card key={schedule.id} className="bg-background-soft flex flex-col">
                        <CardHeader>
                            <CardTitle>{schedule.organizationName}</CardTitle>
                            <CardDescription>Room: {schedule.roomNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4"/>
                                <span>{schedule.days.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="h-4 w-4"/>
                                <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button asChild variant="outline" className="w-full">
                                <Link href={`/dashboard/appointments/${schedule.organizationId}/${schedule.id}`}>View Appointments</Link>
                           </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground">You have not been scheduled for any chambers yet.</p>
        )}
      </div>
    </div>
  );
}
