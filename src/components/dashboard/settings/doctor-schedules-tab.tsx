'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Calendar, DollarSign, Loader2, PlusCircle, UserPlus, Users, X } from "lucide-react";
import { users as allUsers } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  fee: z.coerce.number().positive({ message: "Fee must be a positive number." }),
  days: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one day.",
  })
});

type DoctorSchedule = {
    id: string;
    doctorName: string;
    doctorId: string;
    roomNumber: string;
    fee: number;
    days: string[];
}

const initialSchedules: DoctorSchedule[] = [
    {
        id: 'sched-1',
        doctorName: 'Dr. Anika Rahman',
        doctorId: 'user-doc-1',
        roomNumber: '302',
        fee: 800,
        days: ['Sat', 'Mon', 'Wed']
    }
];

export function DoctorSchedulesTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(initialSchedules);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
      roomNumber: "",
      fee: 0,
      days: []
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const doctor = allUsers.find(u => u.email.startsWith(values.healthId) && u.role === 'doctor');

    if (doctor) {
        const newSchedule: DoctorSchedule = {
            id: `sched-${Date.now()}`,
            doctorId: doctor.id,
            doctorName: doctor.name,
            ...values
        }
        setSchedules(prev => [...prev, newSchedule]);
        toast({
            title: "Schedule Added",
            description: `A new chamber has been scheduled for ${doctor.name}.`,
        });
        form.reset();
        form.setValue("days", []);
    } else {
      toast({
        variant: "destructive",
        title: "Doctor Not Found",
        description: "No doctor found with that Health ID.",
      });
    }

    setIsLoading(false);
  }
  
  const handleDelete = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    toast({
      title: "Schedule Removed",
      description: "The doctor's schedule has been removed.",
    });
  }

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <PlusCircle />
                Add New Schedule
            </h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <FormField
                            control={form.control}
                            name="healthId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Doctor's Health ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., doctor2" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="roomNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Room Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 401-B" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fee"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Consultation Fee</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" placeholder="e.g., 1000" {...field} className="pl-7" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="days"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Chamber Days</FormLabel>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                {weekDays.map((day) => (
                                    <FormField
                                    key={day}
                                    control={form.control}
                                    name="days"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={day}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(day)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), day])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== day
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {day}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Add Schedule"}
                    </Button>
                </form>
            </Form>
        </div>

        <Separator />

        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <Calendar />
                Current Schedules
            </h3>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead>Scheduled Days</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedules.map((schedule) => (
                            <TableRow key={schedule.id}>
                                <TableCell className="font-medium">{schedule.doctorName}</TableCell>
                                <TableCell>{schedule.roomNumber}</TableCell>
                                <TableCell className="font-mono">{schedule.fee.toFixed(2)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                    {schedule.days.map(day => (
                                        <Badge key={day} variant="secondary">{day}</Badge>
                                    ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(schedule.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {schedules.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No doctor schedules have been added yet.</p>}
            </div>
        </div>
    </div>
  );
}
