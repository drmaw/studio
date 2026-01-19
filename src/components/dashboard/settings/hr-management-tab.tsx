
'use client';

import { useState, useMemo, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Firebase and auth hooks
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, updateDocument, getDocs, collection, query, orderBy, limit, startAfter, type DocumentSnapshot, doc } from '@/firebase';
import type { User, Role, Membership, EmployeeDetails } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CurrencyInput } from '@/components/shared/currency-input';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { DutyRoster } from './hr/duty-roster';
import { CardFooter } from '@/components/ui/card';

// Icons
import { Loader2, Users, Edit, Save, CalendarIcon } from 'lucide-react';

type StaffMember = Membership;

// Validation Schema for HR Details
const hrDetailsSchema = z.object({
  joiningDate: z.date().optional(),
  salary: z.coerce.number().min(0, "Salary must be a non-negative number.").optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
});

function EditHrDetailsDialog({ member, orgId, isOpen, setIsOpen, onUpdate }: { member: StaffMember; orgId: string; isOpen: boolean; setIsOpen: (open: boolean) => void; onUpdate: (updatedMember: StaffMember) => void; }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof hrDetailsSchema>>({
    resolver: zodResolver(hrDetailsSchema),
    defaultValues: {
      joiningDate: member.employeeDetails?.joiningDate ? new Date(member.employeeDetails.joiningDate) : undefined,
      salary: member.employeeDetails?.salary || 0,
      bankAccountNumber: member.employeeDetails?.bankAccountNumber || '',
      bankName: member.employeeDetails?.bankName || '',
    },
  });

  const onSubmit = (values: z.infer<typeof hrDetailsSchema>) => {
    if (!firestore) return;
    setIsSaving(true);
    
    const memberRef = doc(firestore, 'organizations', orgId, 'members', member.id);
    const updatedDetails: EmployeeDetails = {
        ...values,
        joiningDate: values.joiningDate ? format(values.joiningDate, 'yyyy-MM-dd') : undefined,
    };

    updateDocument(memberRef, { employeeDetails: updatedDetails }, () => {
      toast({ title: 'Success', description: `${member.userName}'s details have been updated.` });
      onUpdate({ ...member, employeeDetails: updatedDetails });
      setIsSaving(false);
      setIsOpen(false);
    }, () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update details.' });
      setIsSaving(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit HR Details for {member.userName}</DialogTitle>
          <DialogDescription>Update contractual and payment information for this employee.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Joining Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="salary" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Salary (BDT)</FormLabel><FormControl><CurrencyInput type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField name="bankAccountNumber" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bank Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField name="bankName" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Details
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const PAGE_SIZE = 10;

export function HrManagementTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const adminOrgId = searchParams.get('orgId');
  const orgId = hasRole('admin') && adminOrgId ? adminOrgId : useAuth().user?.organizationId;

  const fetchMembers = async (loadMore = false) => {
    if (!firestore || !orgId) return;

    if (loadMore) setIsLoadingMore(true); else setIsLoading(true);
    
    const membersRef = collection(firestore, 'organizations', orgId, 'members');
    let q;
    const queryConstraints = [orderBy('userName'), limit(PAGE_SIZE)];

    if (loadMore && lastVisible) {
        q = query(membersRef, ...queryConstraints, startAfter(lastVisible));
    } else {
        q = query(membersRef, ...queryConstraints);
    }
    
    try {
        const documentSnapshots = await getDocs(q);
        const newMembers = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
        
        setHasMore(newMembers.length === PAGE_SIZE);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setStaff(prev => loadMore ? [...prev, ...newMembers] : newMembers);
    } catch (error) {
        console.error("Error fetching staff members:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch staff members.' });
    } finally {
        if (loadMore) setIsLoadingMore(false); else setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (orgId) {
        fetchMembers();
    }
  }, [orgId]);

  const handleEditClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsDialogOpen(true);
  };
  
  const handleDetailsUpdate = (updatedMember: StaffMember) => {
    setStaff(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };
  
  const staffWithProfessionalRoles = staff.filter(member => member.roles.some(r => r !== 'patient'));

  return (
    <>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <Users />
            Staff List
          </h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                ) : staffWithProfessionalRoles.length > 0 ? (
                  staffWithProfessionalRoles.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.userName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.roles.filter(r => r !== 'patient').map(role => (
                            <Badge key={role} variant="secondary" className="capitalize">{role.replace(/_/g, ' ')}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.employeeDetails?.joiningDate ? format(new Date(member.employeeDetails.joiningDate), 'dd-MM-yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {member.employeeDetails?.salary ? `BDT ${member.employeeDetails.salary.toLocaleString()}`: 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(member)}>
                          <Edit className="mr-2 h-4 w-4" /> Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No staff members found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
             <CardFooter className="justify-center py-4">
                {hasMore && (
                    <Button onClick={() => fetchMembers(true)} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                )}
            </CardFooter>
          </div>
        </div>
        <Separator />
        <DutyRoster staff={staffWithProfessionalRoles} />
      </div>
      {selectedStaff && orgId && (
        <EditHrDetailsDialog 
            member={selectedStaff}
            orgId={orgId}
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            onUpdate={handleDetailsUpdate}
        />
      )}
    </>
  );
}
