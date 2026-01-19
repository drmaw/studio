
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
import { Calendar, Clock, DollarSign, Loader2, PlusCircle, Trash2, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocument, deleteDocument } from "@/firebase";
import { getDocs, collection, query, where, limit, doc, serverTimestamp } from "firebase/firestore";
import type { User, DoctorSchedule, Organization } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";

const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  fee: z.coerce.number().positive({ message: "Fee must be a positive number." }),
  days: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one day.",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});


export function DoctorSchedulesTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user: hospitalOwner, loading: ownerLoading, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const adminOrgId = searchParams.get('orgId');
  const isAdminView = hasRole('admin') && !!adminOrgId;
  const orgId = isAdminView ? adminOrgId : hospitalOwner?.organizationId;

  const organizationDocRef = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return doc(firestore, 'organizations', orgId);
  }, [firestore, orgId]);

  const { data: organization, isLoading: orgLoading } = useDoc<Organization>(organizationDocRef);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(collection(firestore, 'organizations', orgId, 'schedules'), where('organizationId', '==', orgId));
  }, [firestore, orgId]);

  const { data: schedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
      roomNumber: "",
      fee: 1000,
      days: [],
      startTime: "17:00",
      endTime: "21:00",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hospitalOwner || !firestore || !organization || !orgId) return;
    setIsSubmitting(true);
    
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where("healthId", "==", values.healthId), limit(1));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const doctorDoc = querySnapshot.docs[0];
        const doctorData = doctorDoc.data() as User;

        if (!doctorData.roles.includes('doctor')) {
            toast({
                variant: "destructive",
                title: "User Is Not a Doctor",
                description: "The user with this Health ID does not have a 'doctor' role.",
            });
            setIsSubmitting(false);
            return;
        }
        
        const schedulesRef = collection(firestore, 'organizations', orgId, 'schedules');
        
        const newSchedule: Omit<DoctorSchedule, 'id'> = {
            doctorId: doctorData.healthId,
            doctorAuthId: doctorDoc.id,
            doctorName: doctorData.name,
            organizationId: orgId,
            organizationName: organization.name,
            roomNumber: values.roomNumber,
            fee: values.fee,
            days: values.days as any,
            startTime: values.startTime,
            endTime: values.endTime,
            createdAt: serverTimestamp()
        };

        const docRef = await addDocument(schedulesRef, newSchedule);

        if (docRef) {
          toast({
              title: "Schedule Added",
              description: `A new chamber has been scheduled for Dr. ${doctorData.name}.`,
          });
          form.reset();
        }
    } else {
      toast({
        variant: "destructive",
        title: "Doctor Not Found",
        description: "No doctor with that Health ID was found.",
      });
    }

    setIsSubmitting(false);
  }
  
  const handleDelete = async (scheduleId: string) => {
    if (!orgId || !firestore) return;
    const scheduleRef = doc(firestore, 'organizations', orgId, 'schedules', scheduleId);
    
    const success = await deleteDocument(scheduleRef);

    if (success) {
      toast({
        title: "Schedule Removed",
        description: "The doctor's schedule has been removed.",
      });
    }
  }

  const isFormDisabled = isSubmitting || orgLoading || ownerLoading;

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <PlusCircle />
                Add New Schedule
            </h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <fieldset disabled={isFormDisabled} className="space-y-4 p-4 border rounded-lg">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="healthId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Doctor's Health ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1122334455" {...field} />
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
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Start Time (24h)</FormLabel>
                                    <FormControl>
                                    <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>End Time (24h)</FormLabel>
                                    <FormControl>
                                    <Input type="time" {...field} />
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
                        <Button type="submit" disabled={isFormDisabled} className="w-full sm:w-auto">
                            {isFormDisabled ? <Loader2 className="animate-spin" /> : "Add Schedule"}
                        </Button>
                    </fieldset>
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
                            <TableHead>Time</TableHead>
                            <TableHead>Scheduled Days</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedulesLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : schedules && schedules.length > 0 ? (
                            schedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <TableCell className="font-medium">Dr. {schedule.doctorName}</TableCell>
                                    <TableCell>{schedule.roomNumber}</TableCell>
                                    <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                        {schedule.days.map(day => (
                                            <Badge key={day} variant="secondary">{day}</Badge>
                                        ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(schedule.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={5} className="text-center">No doctor schedules have been added yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}
