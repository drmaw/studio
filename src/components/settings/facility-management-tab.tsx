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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Facility = {
    id: string;
    type: 'ward' | 'cabin';
    name: string;
    beds: number;
    cost: number;
};

const initialFacilities: Facility[] = [
    { id: 'fac-1', type: 'ward', name: 'General Ward', beds: 10, cost: 1500 },
    { id: 'fac-2', type: 'cabin', name: 'Deluxe Cabin #101', beds: 1, cost: 5000 },
    { id: 'fac-3', type: 'cabin', name: 'VIP Cabin #201', beds: 2, cost: 8000 },
];

const formSchema = z.object({
  type: z.enum(['ward', 'cabin'], { required_error: "Facility type is required." }),
  name: z.string().min(1, { message: "Facility name is required." }),
  beds: z.coerce.number().positive({ message: "Number of beds must be positive." }),
  cost: z.coerce.number().positive({ message: "Cost must be a positive number." }),
});

export function FacilityManagementTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      beds: 1,
      cost: 1000,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newFacility: Facility = {
        id: `fac-${Date.now()}`,
        ...values,
    };

    setFacilities(prev => [...prev, newFacility]);
    toast({
        title: "Facility Added",
        description: `The ${values.type} "${values.name}" has been added.`,
    });
    
    form.reset({ name: "", beds: 1, cost: 1000, type: values.type });
    setIsLoading(false);
  }

  const handleDelete = (facilityId: string) => {
    setFacilities(prev => prev.filter(f => f.id !== facilityId));
    toast({
      title: "Facility Removed",
      description: "The facility has been removed from the list.",
    });
  };
  
  const handleUpdate = (updatedFacility: Facility) => {
    setFacilities(prev => prev.map(f => f.id === updatedFacility.id ? updatedFacility : f));
     toast({
        title: 'Facility Updated',
        description: 'The facility details have been updated successfully.',
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
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" placeholder="e.g., 1500" {...field} className="pl-7" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Add Facility"}
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
              {facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell className="font-medium">{facility.name}</TableCell>
                  <TableCell className="capitalize">{facility.type}</TableCell>
                  <TableCell>{facility.beds}</TableCell>
                  <TableCell className="font-mono">{facility.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <EditFacilityDialog item={facility} onSave={handleUpdate} />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the facility.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(facility.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {facilities.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No facilities have been added yet.</p>}
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
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: item,
    });

    async function handleSave(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock API call
        
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
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
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
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" {...field} className="pl-7" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
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
