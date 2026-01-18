
'use client'

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, orderBy, query, updateDoc, where } from "firebase/firestore";
import type { Appointment, DoctorSchedule } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FormattedDate } from "@/components/shared/formatted-date";
import { createNotification } from "@/lib/notifications";
import { format } from 'date-fns';

export default function DoctorAppointmentsPage() {
    const params = useParams();
    const scheduleId = params.scheduleId as string;
    const organizationId = params.organizationId as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(
        useMemoFirebase(() => {
            if (!firestore || !scheduleId) return null;
            return query(
                collection(firestore, 'appointments'),
                where('scheduleId', '==', scheduleId),
                orderBy('appointmentDate', 'desc')
            );
        }, [firestore, scheduleId])
    );

    const { data: schedule, isLoading: scheduleLoading } = useDoc<DoctorSchedule>(
        useMemoFirebase(() => {
            if (!firestore || !organizationId || !scheduleId) return null;
            return doc(firestore, 'organizations', organizationId, 'schedules', scheduleId);
        }, [firestore, organizationId, scheduleId])
    );

    const handleStatusChange = async (appointment: Appointment, status: 'confirmed' | 'cancelled') => {
        if (!firestore) return;
        const appointmentRef = doc(firestore, 'appointments', appointment.id);
        await updateDoc(appointmentRef, { status });

        // Notify patient
        const title = status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Cancelled';
        const formattedDate = format(new Date(appointment.appointmentDate), 'dd-MM-yyyy');
        const description = `Your appointment with ${appointment.doctorName} on ${formattedDate} has been ${status}.`;
        
        await createNotification(firestore, appointment.patientId, title, description, '/dashboard/my-appointments');

        toast({
            title: `Appointment ${status}`,
            description: `The appointment has been ${status}.`
        });
    };
    
    const isLoading = appointmentsLoading || scheduleLoading;

    return (
        <div className="space-y-6">
             {isLoading ? (
                <Skeleton className="h-24 w-full" />
             ) : (
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle>Appointments for {schedule?.organizationName}</CardTitle>
                        <CardDescription>
                            Chamber: {schedule?.roomNumber} | Schedule: {schedule?.days.join(', ')} from {schedule?.startTime} to {schedule?.endTime}
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Appointment List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : appointments && appointments.length > 0 ? (
                                appointments.map(apt => (
                                    <TableRow key={apt.id}>
                                        <TableCell>
                                            <div className="font-medium"><FormattedDate date={apt.appointmentDate} formatString="dd-MM-yyyy" /></div>
                                            <div className="text-sm text-muted-foreground">{apt.appointmentTime}</div>
                                        </TableCell>
                                        <TableCell>{apt.patientName}</TableCell>
                                        <TableCell>{apt.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                apt.status === 'confirmed' ? 'default' :
                                                apt.status === 'cancelled' ? 'destructive' :
                                                'secondary'
                                            } className="capitalize">{apt.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {apt.status === 'pending' && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleStatusChange(apt, 'confirmed')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleStatusChange(apt, 'cancelled')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center">No appointments found for this schedule.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
