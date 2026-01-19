'use client'

import { useAuth } from "@/hooks/use-auth";
import { useCollectionGroup, useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query } from "firebase/firestore";
import type { DoctorSchedule, Organization } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Hospital, CalendarDays, Clock, BookOpenCheck, User as UserIcon } from "lucide-react";
import { useMemo } from "react";
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog";

export default function PatientBookingPage() {
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();

    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'schedules'));
    }, [firestore]);

    const { data: allSchedules, isLoading: schedulesLoading } = useCollectionGroup<DoctorSchedule>(schedulesQuery);

    const organizationsWithSchedules = useMemo(() => {
        if (!allSchedules) return [];
        const orgs = new Map<string, { name: string; schedules: DoctorSchedule[] }>();
        
        allSchedules.forEach(schedule => {
            // Exclude personal organizations
            if (schedule.organizationId.startsWith('org-ind-')) return;
            
            if (!orgs.has(schedule.organizationId)) {
                orgs.set(schedule.organizationId, { name: schedule.organizationName, schedules: [] });
            }
            orgs.get(schedule.organizationId)!.schedules.push(schedule);
        });
        
        return Array.from(orgs.entries()).map(([id, data]) => ({ id, ...data }));
    }, [allSchedules]);

    const constructPartialOrg = (id: string, name: string): Organization => ({
        id,
        name,
        ownerId: '', 
        status: 'active',
        createdAt: new Date(),
    });
    
    const isLoading = schedulesLoading || !currentUser;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Book an Appointment"
                description="Browse available doctors and book an appointment yourself."
            />
            {isLoading ? (
                 <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {organizationsWithSchedules.map(org => (
                        <AccordionItem key={org.id} value={org.id} className="border-b-0">
                             <Card className="bg-background-soft">
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <div className="flex items-center gap-4">
                                        <Hospital className="h-6 w-6 text-primary" />
                                        <h3 className="text-xl font-semibold">{org.name}</h3>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {org.schedules.map(schedule => (
                                            <Card key={schedule.id} className="flex flex-col bg-card">
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
                                                    {currentUser && <BookAppointmentDialog schedule={schedule} organization={constructPartialOrg(org.id, org.name)} patient={currentUser} />}
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </AccordionContent>
                             </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
