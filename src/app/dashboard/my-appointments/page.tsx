
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Appointment, DoctorSchedule } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormattedDate } from '@/components/shared/formatted-date';
import { createNotification } from '@/lib/notifications';
import { format } from 'date-fns';

export default function MyAppointmentsPage() {
    const { user, loading: userLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

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
        const appointmentRef = doc(firestore, 'appointments', appointmentId);
        
        const appointmentSnap = await getDoc(appointmentRef);
        if (!appointmentSnap.exists()) return;
        const appointment = appointmentSnap.data() as Appointment;

        await updateDoc(appointmentRef, { status: 'cancelled' });
        
        // Notify doctor
        const scheduleRef = doc(firestore, 'organizations', appointment.organizationId, 'schedules', appointment.scheduleId);
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
            const schedule = scheduleSnap.data() as DoctorSchedule;
            const formattedDate = format(new Date(appointment.appointmentDate), 'dd-MM-yyyy');
            await createNotification(
                firestore,
                schedule.doctorAuthId,
                'Appointment Cancelled',
                `${user.name} has cancelled their appointment for ${formattedDate}.`,
                `/dashboard/appointments/${appointment.organizationId}/${appointment.scheduleId}`
            );
        }

        toast({
            variant: 'destructive',
            title: 'Appointment Cancelled',
            description: 'Your appointment has been successfully cancelled.',
        });
    };
    
    const isLoading = userLoading || appointmentsLoading;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <CalendarCheck className="h-8 w-8" />
                    My Appointments
                </h1>
                <p className="text-muted-foreground">View your upcoming and past appointments.</p>
            </div>
            
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
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm">Cancel</Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will cancel your appointment with {apt.doctorName}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>No</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleCancelAppointment(apt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Cancel</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
