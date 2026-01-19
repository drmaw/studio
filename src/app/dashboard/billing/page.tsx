
'use client'

import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, TestTube, Bed, StethoscopeIcon, Pencil, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, addDocument, updateDocument, deleteDocument } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import type { FeeItem } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CurrencyInput } from "@/components/shared/currency-input";
import { EmptyState } from "@/components/shared/empty-state";


function EditFeeItemDialog({ 
    item, 
    onSave, 
    trigger
}: { 
    item: FeeItem;
    onSave: (updatedItem: FeeItem, callbacks: { onSuccess: () => void; onError: () => void; }) => void;
    trigger: React.ReactNode;
}) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(item.name);
    const [cost, setCost] = useState(item.cost.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
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
        onSave({ ...item, name, cost: parsedCost }, {
            onSuccess: () => {
                setIsSaving(false);
                setIsOpen(false);
            },
            onError: () => {
                setIsSaving(false);
            }
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
                        <CurrencyInput id="cost" value={cost} onChange={e => setCost(e.target.value)} className="col-span-3" />
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
    isLoading,
    placeholder,
    description,
    category,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}: { 
    title: string; 
    icon: React.ReactNode; 
    items: FeeItem[]; 
    isLoading: boolean;
    placeholder: string;
    description: string;
    category: FeeItem['category'];
    onAddItem: (category: FeeItem['category'], name: string, cost: number, callbacks: { onSuccess: () => void; onError: () => void; }) => void;
    onUpdateItem: (item: FeeItem, callbacks: { onSuccess: () => void; onError: () => void; }) => void;
    onDeleteItem: (itemId: string) => void;
}) {
    const { toast } = useToast();
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setIsSubmitting(true);
        onAddItem(category, newItemName, cost, {
            onSuccess: () => {
                setNewItemName('');
                setNewItemCost('');
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : items.length > 0 ? (
                                items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="font-mono">{item.cost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <EditFeeItemDialog
                                                item={item}
                                                onSave={onUpdateItem}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            
                                            <ConfirmationDialog
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                                title="Are you sure?"
                                                description="This action cannot be undone. This will permanently delete the fee item."
                                                onConfirm={() => onDeleteItem(item.id)}
                                                confirmText="Delete"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <EmptyState
                                            icon={TestTube}
                                            message="No items added"
                                            description="No items have been added to this category yet."
                                            className="py-4"
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Input 
                        placeholder={placeholder}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                        disabled={isSubmitting}
                    />
                    <CurrencyInput
                        placeholder="Cost"
                        value={newItemCost}
                        onChange={(e) => setNewItemCost(e.target.value)}
                        className="w-32"
                        disabled={isSubmitting}
                    />
                    <Button onClick={handleAddItem} size="icon" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                        <span className="sr-only">Add Item</span>
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export default function BillingPage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const feeItemsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'organizations', user.organizationId, 'fee_items');
    }, [user, firestore]);

    const { data: feeItems, isLoading } = useCollection<FeeItem>(feeItemsQuery);

    const investigations = useMemo(() => feeItems?.filter(item => item.category === 'investigation') || [], [feeItems]);
    const admissionFees = useMemo(() => feeItems?.filter(item => item.category === 'admission') || [], [feeItems]);
    const doctorFees = useMemo(() => feeItems?.filter(item => item.category === 'doctor_fee') || [], [feeItems]);


    const handleAddItem = (category: FeeItem['category'], name: string, cost: number, callbacks: { onSuccess: () => void, onError: () => void }) => {
        if (!user || !firestore) return;
        const feeItemsRef = collection(firestore, 'organizations', user.organizationId, 'fee_items');
        const newItem = {
            organizationId: user.organizationId,
            category,
            name,
            cost,
            createdAt: serverTimestamp()
        };

        addDocument(feeItemsRef, newItem, (docRef) => {
            if (docRef) {
                toast({
                    title: 'Item Added',
                    description: `"${name}" has been added.`,
                });
                callbacks.onSuccess();
            }
        }, callbacks.onError);
    };
    
    const handleUpdateItem = (item: FeeItem, callbacks: { onSuccess: () => void; onError: () => void; }) => {
        if (!user || !firestore) return;
        const itemRef = doc(firestore, 'organizations', user.organizationId, 'fee_items', item.id);
        const updateData = { name: item.name, cost: item.cost };
        
        updateDocument(itemRef, updateData, () => {
            toast({
                title: 'Item Updated',
                description: 'The fee item has been updated successfully.',
            });
            callbacks.onSuccess();
        }, callbacks.onError);
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (!user || !firestore) return;
        const itemRef = doc(firestore, 'organizations', user.organizationId, 'fee_items', itemId);
        
        deleteDocument(itemRef, () => {
            toast({
                title: 'Item Removed',
                description: 'The item has been removed.',
            });
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Billing & Fees"
                description="Manage the price chart for various services offered at your hospital."
            />
            <Card>
                <CardContent className="pt-6">
                    <Accordion type="multiple" defaultValue={['Investigations']} className="w-full">
                        <FeeCategory
                            title="Investigations"
                            icon={<TestTube className="h-5 w-5 text-primary" />}
                            items={investigations}
                            isLoading={isLoading}
                            placeholder="e.g. Lipid Profile"
                            description="Manage fees for laboratory tests and diagnostic imaging."
                            category="investigation"
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                        />
                        <FeeCategory
                            title="Patient Admission"
                            icon={<Bed className="h-5 w-5 text-primary" />}
                            items={admissionFees}
                            isLoading={isLoading}
                            placeholder="e.g. ICU Admission (per day)"
                            description="Set costs for different types of patient admissions and stays."
                            category="admission"
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                        />
                        <FeeCategory
                            title="Doctor Visit Fees"
                            icon={<StethoscopeIcon className="h-5 w-5 text-primary" />}
                            items={doctorFees}
                            isLoading={isLoading}
                            placeholder="e.g. Dr. Name - Chamber Type"
                            description="Manage consultation fees for different doctors and chambers/specialties."
                            category="doctor_fee"
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
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
