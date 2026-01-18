
'use client'

import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import type { Organization, DoctorSchedule } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Hospital, CalendarDays, Clock, Loader2, User } from "lucide-react";
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog";

export default function BookAppointmentOrgPage() {
    const params = useParams();
    const organizationId = params.organizationId as string;
    const { user, loading: userLoading } = useAuth();
    const firestore = useFirestore();

    const orgDocRef = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return doc(firestore, 'organizations', organizationId);
    }, [firestore, organizationId]);

    const { data: organization, isLoading: orgLoading } = useDoc<Organization>(orgDocRef);
    
    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, 'organizations', organizationId, 'schedules'));
    }, [firestore, organizationId]);

    const { data: schedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);
    
    const isLoading = userLoading || orgLoading || schedulesLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!organization) {
        return <p>Organization not found.</p>
    }

    return (
        <div className="space-y-6">
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-2">
                        <Hospital className="h-8 w-8" />
                        {organization.name}
                    </CardTitle>
                    <CardDescription>
                        {organization.address}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div>
                <h2 className="text-2xl font-bold mb-4">Available Doctors & Schedules</h2>
                {schedules && schedules.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schedules.map(schedule => (
                            <Card key={schedule.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><User /> {schedule.doctorName}</CardTitle>
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
                                    {user && <BookAppointmentDialog schedule={schedule} organization={organization} patient={user} />}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-12 bg-background-soft">
                        <p className="text-muted-foreground">No doctor schedules are available for this organization at the moment.</p>
                    </Card>
                )}
            </div>
        </div>
    )
}
