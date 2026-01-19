
'use client'

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, setDocument } from '@/firebase';
import type { DutyRoster, User } from '@/lib/definitions';
import { doc, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

const shiftSchema = z.object({
  shiftType: z.enum(['Morning', 'Evening', 'Night'], { required_error: 'Shift type is required.' }),
  dutyArea: z.string().min(1, 'Duty area is required.'),
});

interface AssignShiftDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  staffMember: User;
  date: Date;
  orgId: string;
  existingShift: DutyRoster | null;
  onShiftAssigned: () => void;
}

export function AssignShiftDialog({ isOpen, setIsOpen, staffMember, date, orgId, existingShift, onShiftAssigned }: AssignShiftDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      shiftType: existingShift?.shiftType || 'Morning',
      dutyArea: existingShift?.dutyArea || '',
    },
  });

  const onSubmit = (values: z.infer<typeof shiftSchema>) => {
    if (!firestore) return;
    setIsSaving(true);
    
    // Create a unique ID for the shift based on user and date to allow easy updates
    const shiftId = `${staffMember.id}_${format(date, 'yyyy-MM-dd')}`;
    const shiftRef = doc(firestore, 'organizations', orgId, 'rosters', shiftId);

    const shiftData: Omit<DutyRoster, 'id'> = {
      userId: staffMember.id,
      userName: staffMember.name,
      date: format(date, 'yyyy-MM-dd'),
      shiftType: values.shiftType,
      dutyArea: values.dutyArea,
      createdAt: existingShift?.createdAt || serverTimestamp(),
    };

    setDocument(shiftRef, shiftData, { merge: true }, () => {
      toast({ title: 'Shift Assigned', description: `${staffMember.name} has been assigned to the ${values.shiftType} shift.` });
      setIsSaving(false);
      setIsOpen(false);
      onShiftAssigned(); // Callback to refresh the roster view
    }, (error) => {
      console.error('Failed to assign shift:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign shift.' });
      setIsSaving(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Shift for {staffMember.name}</DialogTitle>
          <DialogDescription>
            Date: {format(date, 'PPP')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="shiftType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select shift..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dutyArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duty Area</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., General Ward, ICU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Shift
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
