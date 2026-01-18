
'use client'

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, PlusCircle, TestTube, Bed, StethoscopeIcon, Trash2, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";


type FeeItem = {
    id: string;
    name: string;
    cost: number;
};

const initialInvestigations: FeeItem[] = [
    { id: 'inv-1', name: 'Complete Blood Count (CBC)', cost: 500 },
    { id: 'inv-2', name: 'X-Ray Chest PA view', cost: 700 },
];

const initialAdmissionFees: FeeItem[] = [
    { id: 'adm-1', name: 'General Ward Admission', cost: 1500 },
    { id: 'adm-2', name: 'Private Cabin Admission', cost: 5000 },
];

const initialDoctorFees: FeeItem[] = [
    { id: 'doc-1', name: 'Dr. Anika Rahman - General Consultation', cost: 800 },
    { id: 'doc-2', name: 'Dr. Farid Uddin - Specialist Consultation', cost: 1200 },
];

function EditFeeItemDialog({ 
    item, 
    onSave, 
    trigger
}: { 
    item: FeeItem;
    onSave: (updatedItem: FeeItem) => void;
    trigger: React.ReactNode;
}) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(item.name);
    const [cost, setCost] = useState(item.cost.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const parsedCost = parseFloat(cost);
        if (!name || isNaN(parsedCost) || parsedCost <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please enter a valid item name and a positive cost.',
            });
            return;
        }

        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock API call
        
        onSave({ ...item, name, cost: parsedCost });

        setIsSaving(false);
        setIsOpen(false);
        toast({
            title: 'Item Updated',
            description: 'The fee item has been updated successfully.',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Fee Item</DialogTitle>
                    <DialogDescription>
                        Update the name and cost for this item.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cost" className="text-right">Cost (BDT)</Label>
                        <Input id="cost" type="number" value={cost} onChange={e => setCost(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FeeCategory({ 
    title, 
    icon, 
    items, 
    setItems,
    placeholder,
    description
}: { 
    title: string; 
    icon: React.ReactNode; 
    items: FeeItem[]; 
    setItems: React.Dispatch<React.SetStateAction<FeeItem[]>>;
    placeholder: string;
    description: string;
}) {
    const { toast } = useToast();
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');

    const handleAddItem = () => {
        const cost = parseFloat(newItemCost);
        if (!newItemName || isNaN(cost) || cost <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please enter a valid item name and a positive cost.',
            });
            return;
        }

        const newItem: FeeItem = {
            id: `${title.toLowerCase().replace(' ', '-')}-${Date.now()}`,
            name: newItemName,
            cost: cost,
        };

        setItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemCost('');
        toast({
            title: 'Item Added',
            description: `${newItemName} has been added to ${title}.`,
        });
    };
    
    const handleUpdateItem = (updatedItem: FeeItem) => {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };
    
    const handleDeleteItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast({
            variant: "destructive",
            title: 'Item Removed',
            description: `The item has been removed from ${title}.`,
        });
    };

    return (
        <AccordionItem value={title}>
            <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">{icon} {title}</div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-[150px]">Cost (BDT)</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="font-mono">{item.cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <EditFeeItemDialog
                                            item={item}
                                            onSave={handleUpdateItem}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the fee item.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Input 
                        placeholder={placeholder}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                    />
                    <div className="relative w-32">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="number"
                            placeholder="Cost"
                            value={newItemCost}
                            onChange={(e) => setNewItemCost(e.target.value)}
                            className="pl-7"
                        />
                    </div>
                    <Button onClick={handleAddItem} size="icon">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add Item</span>
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export default function BillingPage() {
    const [investigations, setInvestigations] = useState(initialInvestigations);
    const [admissionFees, setAdmissionFees] = useState(initialAdmissionFees);
    const [doctorFees, setDoctorFees] = useState(initialDoctorFees);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Billing & Fees</h1>
                <p className="text-muted-foreground">Manage the price chart for various services offered at your hospital.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Accordion type="multiple" defaultValue={['Investigations']} className="w-full">
                        <FeeCategory
                            title="Investigations"
                            icon={<TestTube className="h-5 w-5 text-primary" />}
                            items={investigations}
                            setItems={setInvestigations}
                            placeholder="e.g. Lipid Profile"
                            description="Manage fees for laboratory tests and diagnostic imaging."
                        />
                        <FeeCategory
                            title="Patient Admission"
                            icon={<Bed className="h-5 w-5 text-primary" />}
                            items={admissionFees}
                            setItems={setAdmissionFees}
                            placeholder="e.g. ICU Admission (per day)"
                            description="Set costs for different types of patient admissions and stays."
                        />
                        <FeeCategory
                            title="Doctor Visit Fees"
                            icon={<StethoscopeIcon className="h-5 w-5 text-primary" />}
                            items={doctorFees}
                            setItems={setDoctorFees}
                            placeholder="e.g. Dr. Name - Chamber Type"
                            description="Manage consultation fees for different doctors and chambers/specialties."
                        />
                        <AccordionItem value="Surgical Procedures" disabled>
                            <AccordionTrigger className="text-lg font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground">Surgical Procedures (Coming Soon)</div>
                            </AccordionTrigger>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
