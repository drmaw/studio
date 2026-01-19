'use client';

// React & form hooks
import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Firebase hooks and functions
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, addDocument, updateDocument, deleteDocument, writeBatch, commitBatch } from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { InventoryItem, StockLog } from "@/lib/definitions";
import { useSearchParams } from 'next/navigation';

// UI Components
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { FormattedDate } from "@/components/shared/formatted-date";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Icons
import { Loader2, PlusCircle, ClipboardList, MoreHorizontal, Pencil, Trash2, History, Minus, Plus } from "lucide-react";


// Main Component & Add Item Form
const addItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  category: z.string().min(1, "Category is required."),
  quantity: z.coerce.number().int().min(0, "Initial quantity cannot be negative."),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative."),
  unit: z.string().min(1, "Unit is required."),
  location: z.string().optional(),
});

export function InventoryManagementTab() {
  // hooks
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isEditDetailsDialogOpen, setIsEditDetailsDialogOpen] = useState(false);

  // Determine Organization ID
  const adminOrgId = searchParams.get('orgId');
  const orgId = hasRole('admin') && adminOrgId ? adminOrgId : user?.organizationId;

  // Data fetching
  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !orgId) return null;
    return query(collection(firestore, 'organizations', orgId, 'inventory'), orderBy('name'));
  }, [firestore, orgId]);

  const { data: inventory, isLoading } = useCollection<InventoryItem>(inventoryQuery);

  // Form setup
  const form = useForm<z.infer<typeof addItemSchema>>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { name: "", category: "", quantity: 0, reorderLevel: 10, unit: "", location: "" },
  });

  // Add new item handler
  function onAddItem(values: z.infer<typeof addItemSchema>) {
    if (!orgId || !firestore || !user) return;
    setIsSubmitting(true);
    
    const batch = writeBatch(firestore);
    
    const newItemRef = doc(collection(firestore, 'organizations', orgId, 'inventory'));
    const newItem: Omit<InventoryItem, 'id'> = {
      organizationId: orgId,
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      reorderLevel: values.reorderLevel,
      unit: values.unit,
      location: values.location,
      updatedAt: serverTimestamp(),
    };
    batch.set(newItemRef, newItem);

    if (values.quantity > 0) {
        const stockLogRef = doc(collection(newItemRef, 'stock_logs'));
        const initialLog: Omit<StockLog, 'id'> = {
            itemId: newItemRef.id,
            itemName: values.name,
            userId: user.id,
            userName: user.name,
            changeType: 'add',
            quantityChanged: values.quantity,
            reason: 'Initial stock',
            timestamp: serverTimestamp(),
        };
        batch.set(stockLogRef, initialLog);
    }
    
    commitBatch(batch, `add inventory item ${values.name}`, () => {
        toast({ title: "Item Added", description: `${values.name} has been added to the inventory.` });
        form.reset();
        setIsSubmitting(false);
    }, () => setIsSubmitting(false));
  }

  // Delete item handler
  const handleDeleteItem = (item: InventoryItem) => {
    if (!orgId || !firestore) return;
    setDeletingId(item.id);
    const itemRef = doc(firestore, 'organizations', orgId, 'inventory', item.id);
    // Note: In a real app, you might want to archive instead, and handle subcollection deletion.
    deleteDocument(itemRef, () => {
      toast({ title: "Item Deleted", description: `${item.name} has been removed.` });
      setDeletingId(null);
    }, () => setDeletingId(null));
  };
  
  // Handlers to open dialogs
  const openDialog = (setter: React.Dispatch<React.SetStateAction<boolean>>) => (item: InventoryItem) => {
    setSelectedItem(item);
    setter(true);
  };
  
  return (
    <>
      <div className="space-y-8">
        {/* Add Item Form */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <PlusCircle /> Add New Item
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddItem)} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Form fields here */}
                <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="e.g., Paracetamol 500mg" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="category" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Medicines" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="unit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., Strips, Box, Pieces" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="quantity" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Initial Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="reorderLevel" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Re-order Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="location" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Main Pharmacy" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Add Item to Inventory"}
              </Button>
            </form>
          </Form>
        </div>

        <Separator />

        {/* Inventory List Table */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <ClipboardList /> Current Inventory
          </h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Re-order Level</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? ( <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : inventory && inventory.length > 0 ? (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.quantity <= item.reorderLevel ? 'destructive' : 'secondary'}>
                          {item.quantity} {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{item.reorderLevel}</TableCell>
                      <TableCell><FormattedDate date={item.updatedAt} formatString="dd-MM-yyyy" /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={deletingId === item.id}>
                              {deletingId === item.id ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={openDialog(setIsStockDialogOpen)(item)}><Plus className="mr-2"/>Update Stock</DropdownMenuItem>
                            <DropdownMenuItem onSelect={openDialog(setIsEditDetailsDialogOpen)(item)}><Pencil className="mr-2"/>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={openDialog(setIsLogDialogOpen)(item)}><History className="mr-2"/>View History</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <ConfirmationDialog
                                trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2"/>Delete Item</DropdownMenuItem>}
                                title={`Delete ${item.name}?`}
                                description="Are you sure you want to delete this item? This action cannot be undone."
                                onConfirm={() => handleDeleteItem(item)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">No inventory items found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      {selectedItem && (
          <>
            <UpdateStockDialog isOpen={isStockDialogOpen} setIsOpen={setIsStockDialogOpen} item={selectedItem} orgId={orgId!} />
            <EditItemDetailsDialog isOpen={isEditDetailsDialogOpen} setIsOpen={setIsEditDetailsDialogOpen} item={selectedItem} orgId={orgId!} />
            <StockLogDialog isOpen={isLogDialogOpen} setIsOpen={setIsLogDialogOpen} item={selectedItem} orgId={orgId!} />
          </>
      )}
    </>
  );
}

// Update Stock Dialog
const updateStockSchema = z.object({
    changeType: z.enum(['add', 'remove']),
    quantityChanged: z.coerce.number().positive("Quantity must be a positive number."),
    reason: z.string().min(1, "A reason is required for stock changes."),
});

function UpdateStockDialog({isOpen, setIsOpen, item, orgId}: {isOpen: boolean, setIsOpen: (open: boolean) => void, item: InventoryItem, orgId: string}) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof updateStockSchema>>({
        resolver: zodResolver(updateStockSchema),
        defaultValues: { changeType: 'add', quantityChanged: 1, reason: '' },
    });

    const onSubmit = (values: z.infer<typeof updateStockSchema>) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        
        const newQuantity = values.changeType === 'add'
            ? item.quantity + values.quantityChanged
            : item.quantity - values.quantityChanged;

        if (newQuantity < 0) {
            toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Stock quantity cannot go below zero.'});
            setIsSaving(false);
            return;
        }
        
        const batch = writeBatch(firestore);
        const itemRef = doc(firestore, 'organizations', orgId, 'inventory', item.id);
        batch.update(itemRef, { quantity: newQuantity, updatedAt: serverTimestamp() });
        
        const logRef = doc(collection(itemRef, 'stock_logs'));
        const logEntry: Omit<StockLog, 'id'> = {
            itemId: item.id,
            itemName: item.name,
            userId: user.id,
            userName: user.name,
            changeType: values.changeType,
            quantityChanged: values.quantityChanged,
            reason: values.reason,
            timestamp: serverTimestamp(),
        };
        batch.set(logRef, logEntry);
        
        commitBatch(batch, `update stock for ${item.name}`, () => {
            toast({ title: 'Stock Updated' });
            setIsSaving(false);
            setIsOpen(false);
            form.reset({ changeType: 'add', quantityChanged: 1, reason: '' });
        }, () => setIsSaving(false));
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Stock for {item.name}</DialogTitle>
                    <DialogDescription>Current quantity: {item.quantity} {item.unit}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField name="changeType" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Action</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="add"><Plus className="inline-block mr-2 h-4 w-4" />Add to Stock</SelectItem>
                                        <SelectItem value="remove"><Minus className="inline-block mr-2 h-4 w-4" />Remove from Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )} />
                        <FormField name="quantityChanged" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="reason" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Reason</FormLabel><FormControl><Input placeholder="e.g., New shipment received" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 animate-spin h-4 w-4"/>}Save Changes</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Edit Item Details Dialog
const editItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  category: z.string().min(1, "Category is required."),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative."),
  unit: z.string().min(1, "Unit is required."),
  location: z.string().optional(),
});

function EditItemDetailsDialog({isOpen, setIsOpen, item, orgId}: {isOpen: boolean, setIsOpen: (open: boolean) => void, item: InventoryItem, orgId: string}) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof editItemSchema>>({
        resolver: zodResolver(editItemSchema),
        defaultValues: {
            name: item.name,
            category: item.category,
            reorderLevel: item.reorderLevel,
            unit: item.unit,
            location: item.location || '',
        },
    });

    const onSubmit = (values: z.infer<typeof editItemSchema>) => {
        if (!firestore) return;
        setIsSaving(true);
        const itemRef = doc(firestore, 'organizations', orgId, 'inventory', item.id);
        updateDocument(itemRef, { ...values, updatedAt: serverTimestamp() }, () => {
            toast({ title: 'Item Details Updated' });
            setIsSaving(false);
            setIsOpen(false);
        }, () => setIsSaving(false));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Edit Item Details: {item.name}</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Item Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="category" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="unit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Unit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="reorderLevel" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Re-order Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="location" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 animate-spin h-4 w-4"/>}Save Changes</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Stock Log Dialog
function StockLogDialog({isOpen, setIsOpen, item, orgId}: {isOpen: boolean, setIsOpen: (open: boolean) => void, item: InventoryItem, orgId: string}) {
    const firestore = useFirestore();
    const logQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'organizations', orgId, 'inventory', item.id, 'stock_logs'), orderBy('timestamp', 'desc'));
    }, [firestore, orgId, item.id]);

    const { data: logs, isLoading } = useCollection<StockLog>(logQuery);
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Stock History for {item.name}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Reason</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? ( <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin"/></TableCell></TableRow> )
                            : logs && logs.length > 0 ? (
                                logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell><FormattedDate date={log.timestamp} formatString="dd-MM-yyyy, hh:mm" /></TableCell>
                                        <TableCell>{log.userName}</TableCell>
                                        <TableCell className="capitalize">{log.changeType}</TableCell>
                                        <TableCell className={`text-right font-medium ${log.changeType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.changeType === 'add' ? '+' : '-'}{log.quantityChanged}
                                        </TableCell>
                                        <TableCell>{log.reason}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No history found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter><Button onClick={() => setIsOpen(false)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
