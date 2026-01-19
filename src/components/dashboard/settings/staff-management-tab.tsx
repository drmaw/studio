
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
import { useFirestore, deleteDocument, setDocument, getDocs, collection, query, where, doc, limit, getDoc, collectionGroup, orderBy, startAfter, type DocumentSnapshot } from "@/firebase";
import { professionalRolesConfig, staffRoles as assignableStaffRoles } from "@/lib/roles";
import { useSearchParams } from "next/navigation";
import { CardFooter } from "@/components/ui/card";

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  role: z.enum(['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'], { required_error: "You must select a role." }),
});

const PAGE_SIZE = 10;

export function StaffManagementTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: hospitalOwner, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<Membership[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const adminOrgId = searchParams.get('orgId');
  const isAdminView = hasRole('admin') && !!adminOrgId;
  const orgId = isAdminView ? adminOrgId : hospitalOwner?.organizationId;

  const fetchMembers = async (loadMore = false) => {
    if (!firestore || !orgId) return;

    if (loadMore) setIsLoadingMore(true); else setMembersLoading(true);

    const membersRef = collection(firestore, 'organizations', orgId, 'members');
    let q;
    const queryConstraints = [
        orderBy('userName'),
        limit(PAGE_SIZE)
    ];

    if (loadMore && lastVisible) {
        q = query(membersRef, ...queryConstraints, startAfter(lastVisible));
    } else {
        q = query(membersRef, ...queryConstraints);
    }

    try {
        const documentSnapshots = await getDocs(q);
        const newMembers = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Membership));
        
        setHasMore(newMembers.length === PAGE_SIZE);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        setMembers(prev => loadMore ? [...prev, ...newMembers] : newMembers);
    } catch (error) {
        console.error("Error fetching staff members: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch staff members." });
    } finally {
        if(loadMore) setIsLoadingMore(false); else setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
        fetchMembers();
    }
  }, [orgId]);

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
    
    // Check if user is part of another org (excluding their personal one)
    const allMembersQuery = query(collectionGroup(firestore, 'members'), where('userId', '==', userDoc.id));
    const memberSnapshots = await getDocs(allMembersQuery);
    const existingMemberships = memberSnapshots.docs.map(d => d.ref.parent.parent!.id);

    const otherOrgMembership = existingMemberships.find(id => id !== orgId && !id.startsWith('org-ind-'));
    if (otherOrgMembership) {
        toast({
            variant: "destructive",
            title: "User Belongs to Another Organization",
            description: `${userToAdd.name} is already a member of another hospital. They must be removed from their current organization before they can be added.`,
            duration: 6000,
        });
        setIsSubmitting(false);
        return;
    }
    
    const memberRef = doc(firestore, 'organizations', orgId, 'members', userDoc.id);
    const memberSnap = await getDoc(memberRef);

    const newRoles = Array.from(new Set([...(memberSnap.data()?.roles || []), values.role]));

    const membershipData: Partial<Membership> = {
        userId: userDoc.id,
        userName: userToAdd.name,
        userHealthId: userToAdd.healthId,
        roles: newRoles,
        status: 'active',
        consent: memberSnap.data()?.consent || { shareRecords: false },
    };

    setDocument(memberRef, membershipData, { merge: true }, () => {
        toast({
            title: "Staff Added",
            description: `${userToAdd.name} has been assigned the ${values.role.replace(/_/g, ' ')} role in your organization.`,
        });
        fetchMembers(); // Refetch to show the new member
        form.reset();
        setIsSubmitting(false);
    }, () => {
         setIsSubmitting(false);
    });
  }

  const handleRemoveStaff = (member: Membership) => {
    if (!hospitalOwner || !orgId || !firestore) return;

    if (member.userId === hospitalOwner.id && !isAdminView) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'The hospital owner cannot be removed from their own organization.'});
        return;
    }
    
    setRemovingId(member.userId);
    
    const memberRef = doc(firestore, 'organizations', orgId, 'members', member.userId);
    
    deleteDocument(memberRef, () => {
        toast({
            title: "Staff Removed",
            description: `${member.userName} has been removed from your organization.`,
        });
        setMembers(prev => prev.filter(m => m.id !== member.id));
        setRemovingId(null);
    }, () => {
        setRemovingId(null);
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
                                <TableCell colSpan={4} className="text-center h-24">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin"/>
                                </TableCell>
                            </TableRow>
                        )}
                        {!membersLoading && members && members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.userName}</TableCell>
                                <TableCell>{member.userHealthId}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {member.roles.filter(r => r !== 'patient').map(role => (
                                             <Badge key={role} variant="secondary" className="capitalize">
                                                {role.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {member.userId !== hospitalOwner?.id && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={removingId === member.userId}>
                                                    {removingId === member.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {member.userName}?</AlertDialogTitle>
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
                 {!membersLoading && members?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No staff members found in your organization.</p>}
                 <CardFooter className="justify-center py-4">
                    {hasMore && (
                        <Button onClick={() => fetchMembers(true)} disabled={isLoadingMore}>
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                        </Button>
                    )}
                </CardFooter>
            </div>
        </div>
    </div>
  );
}
