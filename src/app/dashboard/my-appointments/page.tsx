
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase, updateDocument } from '@/firebase';
import { collection, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Appointment, DoctorSchedule } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormattedDate } from '@/components/shared/formatted-date';
import { createNotification } from '@/lib/notifications';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useState } from 'react';

export default function MyAppointmentsPage() {
    const { user, loading: userLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const appointmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'appointments'),
            where('patientId', '==', user.id),
            orderBy('appointmentDate', 'desc')
        );
    }, [firestore, user]);

    const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

    const handleCancelAppointment = async (appointmentId: string) => {
        if (!firestore || !user) return;
        setCancellingId(appointmentId);
        const appointmentRef = doc(firestore, 'appointments', appointmentId);
        
        const appointmentSnap = await getDoc(appointmentRef);
        if (!appointmentSnap.exists()) {
            setCancellingId(null);
            return;
        };
        const appointment = appointmentSnap.data() as Appointment;

        const updateData = { status: 'cancelled' };
        
        updateDocument(appointmentRef, updateData, () => {
            // Notify doctor
            if (appointment.organizationId && appointment.scheduleId) {
                const scheduleRef = doc(firestore, 'organizations', appointment.organizationId, 'schedules', appointment.scheduleId);
                getDoc(scheduleRef).then(scheduleSnap => {
                    if (scheduleSnap.exists()) {
                        const schedule = scheduleSnap.data() as DoctorSchedule;
                        const formattedDate = format(new Date(appointment.appointmentDate), 'dd-MM-yyyy');
                        createNotification(
                            firestore,
                            schedule.doctorAuthId,
                            'Appointment Cancelled',
                            `${user.name} has cancelled their appointment for ${formattedDate}.`,
                            `/dashboard/appointments/${appointment.organizationId}/${appointment.scheduleId}`
                        );
                    }
                });
            }


            toast({
                title: 'Appointment Cancelled',
                description: 'Your appointment has been successfully cancelled.',
            });
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
    
    const isLoading = userLoading || appointmentsLoading;

    return (
        <div className="space-y-6">
            <PageHeader 
                title={<><CalendarCheck className="h-8 w-8" />My Appointments</>}
                description="View your upcoming and past appointments."
            />
            
            <Card>
                <CardContent className="pt-6">
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
                            {isLoading ? (
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
                                                    onConfirm={() => handleCancelAppointment(apt.id)}
                                                    confirmText="Yes, Cancel"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">You have no appointments. Click 'Book Appointment' in the sidebar to create one.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
