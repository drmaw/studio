
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
import { Loader2, PlusCircle, Hospital, Bed, DollarSign, Pencil, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, addDocument, updateDocument, deleteDocument } from "@/firebase";
import type { Facility } from "@/lib/definitions";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CurrencyInput } from "@/components/shared/currency-input";

const formSchema = z.object({
  type: z.enum(['ward', 'cabin'], { required_error: "Facility type is required." }),
  name: z.string().min(1, { message: "Facility name is required." }),
  beds: z.coerce.number().positive({ message: "Number of beds must be positive." }),
  cost: z.coerce.number().positive({ message: "Cost must be a positive number." }),
});

export function FacilityManagementTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user: hospitalOwner, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const adminOrgId = searchParams.get('orgId');
  const isAdminView = hasRole('admin') && !!adminOrgId;
  const orgId = isAdminView ? adminOrgId : hospitalOwner?.organizationId;

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return collection(firestore, 'organizations', orgId, 'facilities');
  }, [firestore, orgId]);

  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      beds: 1,
      cost: 1000,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId || !firestore) return;
    setIsSubmitting(true);
    
    const facilitiesRef = collection(firestore, 'organizations', orgId, 'facilities');
    const newFacility = {
        organizationId: orgId,
        ...values,
        createdAt: serverTimestamp()
    };
    
    addDocument(facilitiesRef, newFacility, (docRef) => {
        if (docRef) {
            toast({
                title: "Facility Added",
                description: `The ${values.type} "${values.name}" has been added.`,
            });
            form.reset({ name: "", beds: 1, cost: 1000, type: values.type });
        }
        setIsSubmitting(false);
    });
  }

  const handleDelete = (facilityId: string) => {
    if (!orgId || !firestore) return;
    const facilityRef = doc(firestore, 'organizations', orgId, 'facilities', facilityId);
    
    deleteDocument(facilityRef, () => {
      toast({
        title: "Facility Removed",
        description: "The facility has been removed from the list.",
      });
    });
  };
  
  const handleUpdate = (updatedFacility: Facility) => {
    if (!orgId || !firestore) return;
    const facilityRef = doc(firestore, 'organizations', orgId, 'facilities', updatedFacility.id);
    const { id, organizationId, createdAt, ...updateData } = updatedFacility;
    
    updateDocument(facilityRef, updateData, () => {
     toast({
        title: 'Facility Updated',
        description: 'The facility details have been updated successfully.',
    });
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <PlusCircle />
          Add New Facility
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded-lg space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ward">Ward</SelectItem>
                                    <SelectItem value="cabin">Cabin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Facility Name / Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., General Ward or Cabin #102" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="beds"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Beds</FormLabel>
                        <FormControl>
                           <Input type="number" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cost per Day (BDT)</FormLabel>
                        <FormControl>
                            <CurrencyInput placeholder="e.g., 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Add Facility"}
            </Button>
          </form>
        </Form>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Hospital />
          Current Facilities
        </h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Cost/Day (BDT)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilitiesLoading ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                  </TableRow>
              ) : facilities && facilities.length > 0 ? (
                facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">{facility.name}</TableCell>
                    <TableCell className="capitalize">{facility.type}</TableCell>
                    <TableCell>{facility.beds}</TableCell>
                    <TableCell className="font-mono">{facility.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <EditFacilityDialog item={facility} onSave={handleUpdate} />
                      <ConfirmationDialog
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete the facility."
                            onConfirm={() => handleDelete(facility.id)}
                            confirmText="Delete"
                        />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center p-4 text-sm text-muted-foreground">
                        No facilities have been added yet.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


function EditFacilityDialog({ 
    item, 
    onSave,
}: { 
    item: Facility;
    onSave: (updatedItem: Facility) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: item.name,
            type: item.type,
            beds: item.beds,
            cost: item.cost,
        },
    });

    function handleSave(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        onSave({ ...item, ...values });
        setIsSaving(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Facility</DialogTitle>
                    <DialogDescription>
                        Update the details for this facility.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Facility Name / Number</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="beds"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Number of Beds</FormLabel>
                                <FormControl>
                                   <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cost per Day (BDT)</FormLabel>
                                <FormControl>
                                    <CurrencyInput type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
