
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
import { useState, useMemo } from "react";
import { Loader2, UserPlus, Users, UserX, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User, Role } from "@/lib/definitions";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, limit, writeBatch, updateDoc } from "firebase/firestore";
import { professionalRolesConfig, staffRoles as assignableStaffRoles } from "@/lib/roles";

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  role: z.enum(['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'], { required_error: "You must select a role." }),
});


export function StaffManagementTab() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: hospitalOwner } = useAuth();
  const firestore = useFirestore();

  const staffInOrgQuery = useMemoFirebase(() => {
    if (!firestore || !hospitalOwner?.organizationId) return null;
    return query(collection(firestore, 'users'), 
      where('organizationId', '==', hospitalOwner.organizationId)
    );
  }, [firestore, hospitalOwner?.organizationId]);

  const { data: staffInOrg, isLoading: staffLoading } = useCollection<User>(staffInOrgQuery);

  const staff = useMemo(() => {
    if (!staffInOrg) return [];
    return staffInOrg.filter(user => user.roles.some(role => assignableStaffRoles.includes(role) || role === 'hospital_owner'));
  }, [staffInOrg]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hospitalOwner?.organizationId || !firestore) return;
    setIsLoading(true);

    try {
      const usersRef = collection(firestore, 'users');
      // Find the user by their unique Health ID
      const userSearchQuery = query(usersRef, where('healthId', '==', values.healthId), limit(1));
      const userSnapshot = await getDocs(userSearchQuery);

      if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userToAdd = userDoc.data() as User;
          
          if (userToAdd.organizationId !== hospitalOwner.organizationId && !userToAdd.organizationId.startsWith('org-ind-')) {
            toast({
                variant: "destructive",
                title: "User Belongs to Another Organization",
                description: `${userToAdd.name} is already a member of another hospital. They must be removed from their current organization before they can be hired.`,
                duration: 6000,
            });
            setIsLoading(false);
            return;
          }

          const batch = writeBatch(firestore);
          
          const userDocRef = doc(firestore, 'users', userDoc.id);
          const updatedRoles = Array.from(new Set([...userToAdd.roles, values.role]));
          batch.update(userDocRef, { 
              organizationId: hospitalOwner.organizationId,
              roles: updatedRoles
          });

          await batch.commit();

          toast({
              title: "Staff Added",
              description: `${userToAdd.name} has been assigned the ${values.role.replace(/_/g, ' ')} role in your organization.`,
          });
          form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "No user found with that Health ID.",
        });
      }
    } catch(e) {
         console.error("Error adding staff:", e);
         toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while adding staff.",
        });
    }

    setIsLoading(false);
  }

  const handleRemoveStaff = async (staffMember: User) => {
    if (!hospitalOwner || !firestore) return;

    if (staffMember.id === hospitalOwner.id) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'The hospital owner cannot be removed from their own organization.'});
        return;
    }

    try {
        const userDocRef = doc(firestore, 'users', staffMember.id);
        
        // Revert user to a standard patient role and their personal organization
        const newRoles = ['patient'];
        const personalOrgId = `org-ind-${staffMember.id}`;

        await updateDoc(userDocRef, {
            roles: newRoles,
            organizationId: personalOrgId,
        });

        toast({
            title: "Staff Removed",
            description: `${staffMember.name} has been removed from your organization.`,
        });

    } catch (e) {
        console.error("Error removing staff:", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while removing the staff member.",
        });
    }
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
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Add Staff"}
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
                        {staffLoading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin"/>
                                </TableCell>
                            </TableRow>
                        )}
                        {staff && staff.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.healthId}</TableCell>
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
                                    {member.id !== hospitalOwner?.id && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove all professional roles from this user and un-assign them from your organization. They will revert to a standard patient account. This action cannot be undone.
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
                 {!staffLoading && staff?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No staff members found in your organization.</p>}
            </div>
        </div>
    </div>
  );
}
