
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, updateDocument, useCollectionGroup, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy, doc, getDocs, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';
import type { Appointment, DoctorSchedule, Organization, User } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Loader2, Hospital, CalendarDays, Clock, BookOpenCheck, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormattedDate } from '@/components/shared/formatted-date';
import { createNotification } from '@/lib/notifications';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useState, useEffect, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog";

const PAGE_SIZE = 10;

export default function MyAppointmentsPage() {
    // --- Hooks for My Appointments list ---
    const { user, loading: userLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchAppointments = async (loadMore = false) => {
        if (!user || !firestore) return;

        if (loadMore) setIsLoadingMore(true); else setIsLoadingAppointments(true);

        const baseQuery = [
            collectionGroup(firestore, 'appointments'),
            where('patientId', '==', user.id),
            orderBy('appointmentDate', 'desc'),
            limit(PAGE_SIZE)
        ];

        let q;
        if (loadMore && lastVisible) {
            q = query(...baseQuery, startAfter(lastVisible));
        } else {
            q = query(...baseQuery);
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newAppointments = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
            
            setHasMore(newAppointments.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setAppointments(prev => loadMore ? [...prev, ...newAppointments] : newAppointments);
        } catch (error) {
            console.error("Error fetching appointments: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch appointments." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoadingAppointments(false);
        }
    };
    
    useEffect(() => {
        if (user && firestore) {
            fetchAppointments();
        }
    }, [user, firestore]);

    const handleCancelAppointment = (appointment: Appointment) => {
        if (!firestore || !user) return;
        setCancellingId(appointment.id);
        
        const appointmentRef = doc(firestore, 'organizations', appointment.organizationId, 'appointments', appointment.id);

        const updateData = { status: 'cancelled' };
        
        updateDocument(appointmentRef, updateData, () => {
            // Notify doctor
            if (appointment.organizationId && appointment.scheduleId && appointment.doctorAuthId) {
                const formattedDate = format(new Date(appointment.appointmentDate), 'PPP');
                createNotification(
                    firestore,
                    appointment.doctorAuthId,
                    'Appointment Cancelled',
                    `${user.name} has cancelled their appointment for ${formattedDate}.`,
                    `/dashboard/appointments/${appointment.organizationId}/${appointment.scheduleId}`
                );
            }

            toast({
                title: 'Appointment Cancelled',
                description: 'Your appointment has been successfully cancelled.',
            });
            setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, status: 'cancelled' } : a));
            setCancellingId(null);
        }, () => {
            setCancellingId(null);
            toast({
                variant: "destructive",
                title: "Cancellation Failed",
                description: "Your appointment could not be cancelled. Please try again.",
            });
        });
    };
    
    const pageIsLoading = userLoading || isLoadingAppointments;
    
    // --- Hooks and logic for Booking a new appointment ---
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

    return (
        <div className="space-y-6">
            <PageHeader 
                title={<><CalendarCheck className="h-8 w-8" />My Appointments</>}
                description="View your upcoming appointments and book new ones."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Appointment History</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageIsLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : appointments && appointments.length > 0 ? (
                                appointments.map(apt => (
                                    <TableRow key={apt.id}>
                                        <TableCell className="font-medium">{apt.doctorName}</TableCell>
                                        <TableCell>{apt.organizationName}</TableCell>
                                        <TableCell>
                                            <div className="font-medium"><FormattedDate date={apt.appointmentDate} formatString="dd-MM-yyyy" /></div>
                                            <div className="text-sm text-muted-foreground">{apt.appointmentTime}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                apt.status === 'confirmed' ? 'default' :
                                                apt.status === 'cancelled' ? 'destructive' :
                                                'secondary'
                                            } className="capitalize">{apt.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                <ConfirmationDialog
                                                    trigger={<Button variant="outline" size="sm" disabled={cancellingId === apt.id}>
                                                        {cancellingId === apt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                                                    </Button>}
                                                    title="Are you sure?"
                                                    description={`This will cancel your appointment with ${apt.doctorName}. This action cannot be undone.`}
                                                    onConfirm={() => handleCancelAppointment(apt)}
                                                    confirmText="Yes, Cancel"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">You have no appointments. Book one below.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-center py-4">
                    {hasMore && (
                        <Button onClick={() => fetchAppointments(true)} disabled={isLoadingMore}>
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Book a New Appointment</CardTitle>
                    <CardDescription>Browse available doctors and book an appointment yourself.</CardDescription>
                </CardHeader>
                <CardContent>
                    {schedulesLoading ? (
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
                                                            {user && <BookAppointmentDialog schedule={schedule} organization={constructPartialOrg(org.id, org.name)} patient={user} />}
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
                </CardContent>
            </Card>
        </div>
    )
}
