
'use client'

import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, QrCode, UserX, Loader2, Hospital, CalendarDays, Clock, BookOpenCheck, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCollection, useDoc, useFirestore, useMemoFirebase, addDocument } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog";
import { usePatientSearch } from "@/hooks/use-patient-search";
import { PageHeader } from "@/components/shared/page-header";
import { QrScannerDialog } from "@/components/dashboard/qr-scanner-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PatientInfoCard } from "@/components/shared/patient-info-card";
import type { DoctorSchedule, Organization, User } from "@/lib/definitions";

export default function BookAppointmentPage() {
    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResult,
        handleSearch,
    } = usePatientSearch();

    const { user: currentUser, hasRole } = useAuth();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const adminOrgId = searchParams.get('orgId');
    const isViewingAsAdmin = hasRole('admin') && !!adminOrgId;
    const effectiveOrgId = isViewingAsAdmin ? adminOrgId : currentUser?.organizationId;

    const orgDocRef = useMemoFirebase(() => {
        if (!firestore || !effectiveOrgId) return null;
        return doc(firestore, 'organizations', effectiveOrgId);
    }, [firestore, effectiveOrgId]);

    const { data: organization, isLoading: orgLoading } = useDoc<Organization>(orgDocRef);
    
    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore || !effectiveOrgId) return null;
        return query(collection(firestore, 'organizations', effectiveOrgId, 'schedules'));
    }, [firestore, effectiveOrgId]);

    const { data: schedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);
    
    const isLoading = orgLoading || schedulesLoading;
    const searchedPatient = searchResult !== 'not_found' ? searchResult : null;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Book an Appointment"
                description="Search for a patient and book a consultation with an available doctor."
            />

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>1. Find Patient</CardTitle>
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
                </CardContent>
            </Card>

            {isSearching && (
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            )}
            
            {searchResult === 'not_found' && (
                 <EmptyState
                    icon={UserX}
                    message="No Patient Found"
                    description="No patient record matches the provided ID or mobile number."
                 />
            )}

            {searchedPatient && (
                <>
                    <PatientInfoCard patient={searchedPatient} />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Doctor & Schedule</CardTitle>
                            <CardDescription>Choose an available doctor to book an appointment for {searchedPatient.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> :
                            schedules && schedules.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {schedules.map(schedule => (
                                        <Card key={schedule.id} className="flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><UserIcon /> {schedule.doctorName}</CardTitle>
                                                <CardDescription>Room: {schedule.roomNumber} | Fee: {schedule.fee} BDT</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span>{schedule.days.join(', ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{schedule.startTime} - {schedule.endTime}</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                {currentUser && organization && <BookAppointmentDialog schedule={schedule} organization={organization} patient={searchedPatient} />}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-muted-foreground">No doctor schedules found for this organization.</div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
