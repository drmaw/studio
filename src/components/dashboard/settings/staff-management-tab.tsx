
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/definitions";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, limit } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  role: z.enum(['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'], { required_error: "You must select a role." }),
});


export function StaffManagementTab() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: hospitalOwner } = useAuth();
  const firestore = useFirestore();

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !hospitalOwner?.organizationId) return null;
    // Query for users that are NOT patients and belong to the owner's organization
    return query(collection(firestore, 'users'), 
      where('organizationId', '==', hospitalOwner.organizationId),
      where('roles', 'array-contains-any', ['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk', 'hospital_owner'])
    );
  }, [firestore, hospitalOwner?.organizationId]);

  const { data: staff, isLoading: staffLoading } = useCollection<User>(staffQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hospitalOwner?.organizationId) return;
    setIsLoading(true);

    try {
      const usersRef = collection(firestore, 'users');
      // We search by healthId, but Firestore document ID is the UID.
      // So first find the user by healthId
      const userSearchQuery = query(usersRef, where('healthId', '==', values.healthId), limit(1));
      const userSnapshot = await getDocs(userSearchQuery);

      if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userToAdd = userDoc.data() as User;
          const userDocRef = doc(firestore, 'users', userDoc.id);
          
          const updatedRoles = Array.from(new Set([...userToAdd.roles, values.role]));

          updateDocumentNonBlocking(userDocRef, { 
              organizationId: hospitalOwner.organizationId,
              roles: updatedRoles
          });

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
         toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while adding staff.",
        });
    }

    setIsLoading(false);
  }

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
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="lab_technician">Lab Technician</SelectItem>
                                <SelectItem value="pathologist">Pathologist</SelectItem>
                                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                                <SelectItem value="front_desk">Front Desk</SelectItem>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffLoading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
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
