
'use client'

import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Appointment, DoctorSchedule } from '@/lib/definitions';
import { add, format, parse, startOfDay, getDay, eachMinuteOfInterval, isBefore, isAfter } from 'date-fns';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const dayMapping = { 'Sat': 6, 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };

async function createNotification(firestore: any, userId: string, title: string, description: string, href?: string) {
    const notificationsRef = collection(firestore, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
        userId,
        title,
        description,
        href: href || '#',
        isRead: false,
        createdAt: serverTimestamp(),
    });
}

export function BookAppointmentCalendar({ schedule }: { schedule: DoctorSchedule }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const disabledDays = useMemo(() => {
        const enabledDays = schedule.days.map(d => dayMapping[d]);
        return [0, 1, 2, 3, 4, 5, 6].filter(d => !enabledDays.includes(d));
    }, [schedule.days]);

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';

    const appointmentsQuery = useMemoFirebase(() => {
        if (!firestore || !formattedDate) return null;
        return query(
            collection(firestore, 'appointments'),
            where('scheduleId', '==', schedule.id),
            where('appointmentDate', '==', formattedDate)
        );
    }, [firestore, schedule.id, formattedDate]);

    const { data: appointmentsOnDate } = useCollection<Appointment>(appointmentsQuery);
    
    const bookedSlots = useMemo(() => {
        return appointmentsOnDate?.map(apt => apt.appointmentTime) || [];
    }, [appointmentsOnDate]);

    const timeSlots = useMemo(() => {
        if (!date) return [];

        const startTime = parse(schedule.startTime, 'HH:mm', date);
        const endTime = parse(schedule.endTime, 'HH:mm', date);

        if (isBefore(endTime, startTime)) return [];
        
        return eachMinuteOfInterval({ start: startTime, end: endTime }, { step: 30 })
            .map(t => format(t, 'hh:mm a'));

    }, [date, schedule.startTime, schedule.endTime]);

    const handleBooking = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to book an appointment.' });
            router.push('/login');
            return;
        }
        if (!selectedTime || !date || !reason) {
            toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Please provide a reason for your visit.' });
            return;
        }
        
        setIsBooking(true);

        const newAppointment = {
            patientId: user.id,
            patientName: user.name,
            doctorId: schedule.doctorId,
            doctorName: schedule.doctorName,
            organizationId: schedule.organizationId,
            organizationName: schedule.organizationName,
            scheduleId: schedule.id,
            appointmentDate: format(date, 'yyyy-MM-dd'),
            appointmentTime: selectedTime,
            status: 'pending' as const,
            reason: reason,
            createdAt: serverTimestamp()
        };

        const appointmentRef = await addDoc(collection(firestore, 'appointments'), newAppointment);

        // Notify the doctor
        await createNotification(
            firestore,
            schedule.doctorAuthId,
            'New Appointment Request',
            `${user.name} has requested an appointment on ${format(date, 'dd-MM-yyyy')} at ${selectedTime}.`,
            `/dashboard/appointments/${schedule.organizationId}/${schedule.id}`
        );

        setIsBooking(false);
        setIsDialogOpen(false);
        setSelectedTime(null);
        setReason('');

        toast({
            title: 'Appointment Requested',
            description: `Your appointment with ${schedule.doctorName} is pending confirmation.`,
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border bg-background"
                disabled={[{ dayOfWeek: disabledDays }, { before: new Date() }]}
            />
            <div className="flex-1">
                <h4 className="font-semibold mb-2">Available Slots for {date ? format(date, 'dd-MM-yyyy') : '...'}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                            <DialogTrigger key={slot} asChild>
                                <Button 
                                    variant="outline"
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(slot)}
                                >
                                    {slot}
                                </Button>
                             </DialogTrigger>
                        );
                    })}
                </div>
                 <Dialog open={isDialogOpen || !!selectedTime} onOpenChange={(open) => { if(!open) setSelectedTime(null); setIsDialogOpen(open); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Appointment</DialogTitle>
                            <DialogDescription>
                                You are booking an appointment with {schedule.doctorName} at {schedule.organizationName} on {date ? format(date, 'dd-MM-yyyy') : ''} at {selectedTime}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label htmlFor="reason">Reason for visit</Label>
                            <Textarea 
                                id="reason" 
                                placeholder="e.g., General check-up, fever..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setSelectedTime(null); setIsDialogOpen(false);}}>Cancel</Button>
                            <Button onClick={handleBooking} disabled={isBooking || !reason}>
                                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Booking
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
