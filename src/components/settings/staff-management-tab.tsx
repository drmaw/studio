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
import { users as allUsers } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/definitions";

const formSchema = z.object({
  healthId: z.string().min(1, { message: "Health ID is required." }),
  role: z.enum(['doctor', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'], { required_error: "You must select a role." }),
});

// Mock staff list for the hospital
const initialStaff: User[] = [
    allUsers.find(u => u.id === '8912409021')!,
];

export function StaffManagementTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>(initialStaff);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      healthId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For the mock, we'll use health ID
    const userToAdd = allUsers.find(u => u.id === values.healthId);

    if (userToAdd && !staff.some(s => s.id === userToAdd.id)) {
      // In a real app, you would change the user's role in the database.
      // Here, we'll just add them to the local staff list with the assigned role.
      setStaff(prevStaff => [...prevStaff, { ...userToAdd, roles: [...userToAdd.roles, values.role] }]);
      toast({
        title: "Staff Added",
        description: `${userToAdd.name} has been added as a ${values.role.replace('_', ' ')}.`,
      });
      form.reset();
    } else if (staff.some(s => s.id === userToAdd?.id)) {
        toast({
            variant: "destructive",
            title: "Staff Already Exists",
            description: `${userToAdd.name} is already part of your staff.`,
        });
    } 
    else {
      toast({
        variant: "destructive",
        title: "User Not Found",
        description: "No user found with that Health ID.",
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
                            <Input placeholder="Enter user's Health ID (e.g., 0987654321)" {...field} />
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
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {member.roles.map(role => (
                                             <Badge key={role} variant="secondary" className="capitalize">
                                                {role.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}
