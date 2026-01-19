
'use client'

import { useParams } from "next/navigation";
import { useDoc, useCollection, useFirestore, useMemoFirebase, addDocument, deleteDocument, updateDocument, commitBatch, writeBatch } from "@/firebase";
import { doc, collection, orderBy, query } from "firebase/firestore";
import type { Invoice, InvoiceItem, User } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trash2, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { FormattedDate } from "@/components/shared/formatted-date";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AddInvoiceItemDialog } from "@/components/dashboard/billing/add-invoice-item-dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react";

export default function InvoiceDetailPage() {
    const params = useParams();
    const invoiceId = params.invoiceId as string;
    const { user: currentUser, loading: userLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const orgId = currentUser?.organizationId;

    const invoiceRef = useMemoFirebase(() => {
        if (!firestore || !orgId || !invoiceId) return null;
        return doc(firestore, 'organizations', orgId, 'invoices', invoiceId);
    }, [firestore, orgId, invoiceId]);

    const { data: invoice, isLoading: invoiceLoading } = useDoc<Invoice>(invoiceRef);
    
    const patientRef = useMemoFirebase(() => {
        if (!firestore || !invoice?.patientId) return null;
        return doc(firestore, 'users', invoice.patientId);
    }, [firestore, invoice?.patientId]);
    
    const { data: patient, isLoading: patientLoading } = useDoc<User>(patientRef);

    const itemsRef = useMemoFirebase(() => {
        if (!invoiceRef) return null;
        return query(collection(invoiceRef, 'items'), orderBy('createdAt', 'asc'));
    }, [invoiceRef]);

    const { data: items, isLoading: itemsLoading } = useCollection<InvoiceItem>(itemsRef);

    const isLoading = userLoading || invoiceLoading || itemsLoading || patientLoading;

    const calculateTotal = (items: InvoiceItem[]) => {
        return items.reduce((acc, item) => acc + item.totalCost, 0);
    }

    const handleAddItem = (name: string, quantity: number, unitCost: number) => {
        if (!invoiceRef || !items) return;
        const totalCost = quantity * unitCost;
        const newItem: Omit<InvoiceItem, 'id'> = {
            name,
            quantity,
            unitCost,
            totalCost,
            createdAt: new Date(), // This will be converted by serverTimestamp in the function
        };

        const batch = writeBatch(firestore);
        
        // Add new item
        const newItemRef = doc(collection(invoiceRef, 'items'));
        batch.set(newItemRef, newItem);

        // Update invoice total
        const newTotal = calculateTotal(items) + totalCost;
        batch.update(invoiceRef, { totalAmount: newTotal });

        commitBatch(batch, 'add invoice item', () => {
             toast({ title: 'Item Added', description: `${name} has been added to the invoice.` });
        }, () => {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not add item to the invoice.' });
        });
    };

    const handleDeleteItem = (item: InvoiceItem) => {
        if (!invoiceRef || !items) return;
        
        const itemRef = doc(invoiceRef, 'items', item.id);

        const batch = writeBatch(firestore);
        batch.delete(itemRef);

        const newTotal = calculateTotal(items) - item.totalCost;
        batch.update(invoiceRef, { totalAmount: newTotal });

        commitBatch(batch, 'delete invoice item', () => {
            toast({ title: 'Item Removed', description: `${item.name} has been removed from the invoice.` });
        }, () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove item from the invoice.' });
        });
    };

    const handleStatusUpdate = (status: 'open' | 'paid' | 'void') => {
        if (!invoiceRef) return;
        updateDocument(invoiceRef, { status }, () => {
            toast({ title: 'Invoice Updated', description: `Invoice status has been changed to ${status}.` });
        });
    };
    
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 md:col-span-2" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (!invoice) {
        return <p>Invoice not found.</p>;
    }
    
    const invoiceStatus = invoice.status || 'draft';

    return (
        <div className="space-y-6">
            <PageHeader 
                title={
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/billing"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
                        <span>Invoice #{invoice.id.substring(0, 8)}</span>
                    </div>
                }
                description={`Status: ${invoiceStatus}`}
            >
                <Badge variant={
                    invoiceStatus === 'paid' ? 'default' :
                    invoiceStatus === 'draft' ? 'secondary' :
                    'destructive'
                } className="capitalize text-base px-3 py-1">{invoiceStatus}</Badge>
            </PageHeader>
            
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Billed To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{patient?.name}</p>
                        <p className="text-sm text-muted-foreground">{patient?.demographics?.mobileNumber}</p>
                        <p className="text-sm text-muted-foreground">{patient?.demographics?.presentAddress}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p><strong>Date Issued:</strong> <FormattedDate date={invoice.createdAt} formatString="dd-MM-yyyy" /></p>
                        <p><strong>Date Due:</strong> <FormattedDate date={invoice.dueDate} formatString="dd-MM-yyyy" /></p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Invoice Items</CardTitle>
                    {invoiceStatus === 'draft' && <AddInvoiceItemDialog onAddItem={handleAddItem} />}
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                    {invoiceStatus === 'draft' && <TableHead className="w-[50px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items && items.length > 0 ? (
                                    items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{item.unitCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{item.totalCost.toFixed(2)}</TableCell>
                                            {invoiceStatus === 'draft' && <TableCell className="text-right">
                                                <ConfirmationDialog
                                                    trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                                                    title="Are you sure?"
                                                    description={`This will remove "${item.name}" from the invoice.`}
                                                    onConfirm={() => handleDeleteItem(item)}
                                                />
                                            </TableCell>}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No items have been added to this invoice yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end items-center gap-6 bg-muted/50 p-4 border-t">
                    <div className="text-right">
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold font-mono">BDT {invoice.totalAmount.toFixed(2)}</p>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Update the status of this invoice.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    {invoiceStatus === 'draft' && (
                         <Button onClick={() => handleStatusUpdate('open')}>
                            <Send className="mr-2 h-4 w-4" /> Finalize and Send
                        </Button>
                    )}
                    {invoiceStatus === 'open' && (
                        <Button onClick={() => handleStatusUpdate('paid')}>Mark as Paid</Button>
                    )}
                    {(invoiceStatus === 'draft' || invoiceStatus === 'open') && (
                         <ConfirmationDialog
                            trigger={<Button variant="destructive">Void Invoice</Button>}
                            title="Are you sure?"
                            description="This invoice will be marked as void. This action cannot be undone."
                            onConfirm={() => handleStatusUpdate('void')}
                        />
                    )}
                     {invoiceStatus === 'paid' && <p className="text-sm text-green-600 font-medium">This invoice has been paid.</p>}
                     {invoiceStatus === 'void' && <p className="text-sm text-destructive font-medium">This invoice has been voided.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

