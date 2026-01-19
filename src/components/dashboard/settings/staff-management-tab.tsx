
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { Loader2, UserPlus, Users, UserX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User, Role, Membership } from "@/lib/definitions";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, deleteDocument, setDocument, addDocument } from "@/firebase";
import { collection, query, where, getDocs, doc, limit, getDoc } from "firebase/firestore";
import { professionalRolesConfig, staffRoles as assignableStaffRoles } from "@/lib/roles";
import { useSearchParams } from "next/navigation";

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  role: z.enum(['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'], { required_error: "You must select a role." }),
});

type StaffMember = User & { memberRoles: Role[] };

export function StaffManagementTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const { toast } = useToast();
  const { user: hospitalOwner, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const adminOrgId = searchParams.get('orgId');
  const isAdminView = hasRole('admin') && !!adminOrgId;
  const orgId = isAdminView ? adminOrgId : hospitalOwner?.organizationId;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return collection(firestore, 'organizations', orgId, 'members');
  }, [firestore, orgId]);

  const { data: members, isLoading: membersLoading } = useCollection<Membership>(membersQuery);
  
  useEffect(() => {
    if (!members || !firestore) {
        setStaff([]);
        return;
    };
    
    const fetchStaffDetails = async () => {
        if(members.length === 0) {
            setStaff([]);
            return;
        }

        const userIds = members.map(m => m.userId);
        const usersRef = collection(firestore, 'users');
        const usersQuery = query(usersRef, where('__name__', 'in', userIds));
        const userSnapshots = await getDocs(usersQuery);
        
        const usersById = new Map(userSnapshots.docs.map(d => [d.id, { ...d.data() as User, id: d.id }]));

        const combinedStaff = members.map(member => {
            const user = usersById.get(member.userId);
            return {
                ...user,
                id: member.userId,
                memberRoles: member.roles
            } as StaffMember;
        }).filter(s => s.id);

        setStaff(combinedStaff);
    }
    fetchStaffDetails();
  }, [members, firestore]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId || !firestore) return;
    setIsSubmitting(true);

    const usersRef = collection(firestore, 'users');
    const userSearchQuery = query(usersRef, where('healthId', '==', values.healthId), limit(1));
    const userSnapshot = await getDocs(userSearchQuery);

    if (userSnapshot.empty) {
        toast({
            variant: "destructive",
            title: "User Not Found",
            description: "No user found with that Health ID.",
        });
        setIsSubmitting(false);
        return;
    }

    const userDoc = userSnapshot.docs[0];
    const userToAdd = userDoc.data() as User;
    
    const memberRef = doc(firestore, 'organizations', orgId, 'members', userDoc.id);
    const memberSnap = await getDoc(memberRef);

    const newRoles = Array.from(new Set([...(memberSnap.data()?.roles || []), values.role]));

    const membershipData: Omit<Membership, 'id'> = {
        userId: userDoc.id,
        userName: userToAdd.name,
        roles: newRoles,
        status: 'active',
    };

    setDocument(memberRef, membershipData, { merge: true }, () => {
        toast({
            title: "Staff Added",
            description: `${userToAdd.name} has been assigned the ${values.role.replace(/_/g, ' ')} role in your organization.`,
        });
        form.reset();
        setIsSubmitting(false);
    }, () => {
         setIsSubmitting(false);
        toast({
            variant: 'destructive',
            title: 'Failed to Add Staff',
            description: 'The user could not be added to your organization.',
        });
    });
  }

  const handleRemoveStaff = (staffMember: StaffMember) => {
    if (!hospitalOwner || !orgId || !firestore) return;

    if (staffMember.id === hospitalOwner.id && !isAdminView) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'The hospital owner cannot be removed from their own organization.'});
        return;
    }

    const originalStaff = staff;
    setStaff(currentStaff => currentStaff.filter(s => s.id !== staffMember.id));
    setRemovingId(staffMember.id);
    
    const memberRef = doc(firestore, 'organizations', orgId, 'members', staffMember.id);
    
    deleteDocument(memberRef, () => {
        toast({
            title: "Staff Removed",
            description: `${staffMember.name} has been removed from your organization.`,
        });
        setRemovingId(null);
    }, () => {
        setStaff(originalStaff);
        setRemovingId(null);
        toast({
            variant: 'destructive',
            title: 'Failed to Remove',
            description: 'The staff member could not be removed.',
        });
    });
  };

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <UserPlus />
                Add New Staff
            </h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-lg">
                    <FormField
                    control={form.control}
                    name="healthId"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>User Health ID</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter user's 10-digit Health ID" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem className="w-full sm:w-auto">
                        <FormLabel>Assign Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {assignableStaffRoles.map(role => {
                                    const roleInfo = professionalRolesConfig[role];
                                    return <SelectItem key={role} value={role}>{roleInfo?.label || role}</SelectItem>
                                })}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Add Staff"}
                    </Button>
                </form>
            </Form>
        </div>

        <Separator />

        <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <Users />
                Current Staff
            </h3>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Health ID</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {membersLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin"/>
                                </TableCell>
                            </TableRow>
                        )}
                        {!membersLoading && staff && staff.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.healthId}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {member.memberRoles.filter(r => r !== 'patient').map(role => (
                                             <Badge key={role} variant="secondary" className="capitalize">
                                                {role.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.id !== hospitalOwner?.id && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={removingId === member.id}>
                                                    {removingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove all professional roles from this user and un-assign them from your organization. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemoveStaff(member)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        Confirm Removal
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {!membersLoading && staff?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No staff members found in your organization.</p>}
            </div>
        </div>
    </div>
  );
}
