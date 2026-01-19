
'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { serverTimestamp, collection } from "firebase/firestore";
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocument } from "@/firebase";
import { cn } from "@/lib/utils";
import type { DoctorSchedule, Organization, User } from "@/lib/definitions";
import { createNotification } from "@/lib/notifications";
import { Loader2, CalendarIcon, BookOpenCheck } from "lucide-react";


const formSchema = z.object({
  appointmentDate: z.date({
    required_error: "An appointment date is required.",
  }),
  appointmentTime: z.string({
    required_error: "Please select an appointment time.",
  }),
  reason: z.string().max(200, "Reason must be 200 characters or less.").optional(),
});


// Helper to generate time slots
const generateTimeSlots = (start: string, end: string, intervalMinutes: number): string[] => {
    const slots = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
        slots.push(format(currentTime, 'hh:mm a'));
        currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }
    return slots;
};

export function BookAppointmentDialog({ schedule, organization, patient }: { schedule: DoctorSchedule, organization: Organization, patient: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const timeSlots = generateTimeSlots(schedule.startTime, schedule.endTime, 30);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsBooking(true);
    const appointmentRef = collection(firestore, 'appointments');
    const formattedDate = format(values.appointmentDate, 'dd-MM-yyyy');

    const newAppointment = {
        patientId: patient.id,
        patientName: patient.name,
        doctorId: schedule.doctorId,
        doctorName: schedule.doctorName,
        doctorAuthId: schedule.doctorAuthId,
        organizationId: organization.id,
        organizationName: organization.name,
        scheduleId: schedule.id,
        appointmentDate: format(values.appointmentDate, 'yyyy-MM-dd'),
        appointmentTime: values.appointmentTime,
        reason: values.reason || '',
        status: 'pending' as const,
        createdAt: serverTimestamp(),
    };

    addDocument(appointmentRef, newAppointment, (docRef) => {
        if (docRef) {
            // Notify the doctor of the new request
            createNotification(
                firestore, 
                schedule.doctorAuthId,
                'New Appointment Request',
                `${patient.name} has requested an appointment on ${formattedDate} at ${values.appointmentTime}.`,
                `/dashboard/appointments/${organization.id}/${schedule.id}`
            );

            // Notify the patient that an appointment was booked for them
            if (patient.id !== schedule.doctorAuthId) { // Avoid self-notification
                createNotification(
                    firestore,
                    patient.id,
                    'New Appointment Booked',
                    `An appointment with ${schedule.doctorName} on ${formattedDate} at ${values.appointmentTime} has been booked for you. It is pending confirmation.`,
                    '/dashboard/my-appointments'
                );
            }

            toast({
                title: "Appointment Requested!",
                description: "Your request has been sent to the doctor for confirmation.",
            });
            setIsOpen(false);
            form.reset();
        }
        setIsBooking(false);
    }, () => {
        setIsBooking(false);
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "The appointment could not be requested. Please try again.",
        });
    });
  }

  const scheduleDays = schedule.days.map(d => d.toLowerCase());
  const dayNameToNumber: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
            <BookOpenCheck className="mr-2 h-4 w-4" />
            Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment with {schedule.doctorName}</DialogTitle>
          <DialogDescription>
            Select a date and time for your consultation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0)) || 
                                    !scheduleDays.includes(format(date, 'EEE').toLowerCase())
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time Slot</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an available time slot" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {timeSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Reason for Visit (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Briefly describe the reason for your visit..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
