
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, addDocument, updateDocument, getDocs, collection, query, orderBy, serverTimestamp, doc, limit, startAfter, type DocumentSnapshot } from '@/firebase';
import type { Settlement, Organization } from '@/lib/definitions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { HandCoins, Loader2, CheckCircle } from 'lucide-react';
import { CurrencyInput } from '@/components/shared/currency-input';
import { FormattedDate } from '@/components/shared/formatted-date';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

const PAGE_SIZE = 10;

const settlementSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than zero." }),
});

export default function SettlementsPage() {
  const { user, hasRole, organizationId } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const orgDocRef = useDoc(doc(firestore, 'organizations', organizationId!));
  const organization = orgDocRef.data as Organization;
  const isOrgLoading = orgDocRef.isLoading;

  const form = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: { amount: 0 },
  });

  const fetchSettlements = async (loadMore = false) => {
    if (!firestore || !organizationId) return;

    if(loadMore) setIsLoadingMore(true); else setIsLoading(true);

    const settlementsRef = collection(firestore, 'organizations', organizationId, 'settlements');
    let q;
    const queryConstraints = [orderBy('initiatedAt', 'desc'), limit(PAGE_SIZE)];
    
    if (loadMore && lastVisible) {
        q = query(settlementsRef, ...queryConstraints, startAfter(lastVisible));
    } else {
        q = query(settlementsRef, ...queryConstraints);
    }

    try {
        const documentSnapshots = await getDocs(q);
        const newSettlements = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Settlement));
        
        setHasMore(newSettlements.length === PAGE_SIZE);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        setSettlements(prev => loadMore ? [...prev, ...newSettlements] : newSettlements);
    } catch (error) {
        console.error("Error fetching settlements: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not fetch settlements." });
    } finally {
        if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (organizationId) {
        fetchSettlements();
    }
  }, [organizationId]);


  const onSubmit = (values: z.infer<typeof settlementSchema>) => {
    if (!user || !organizationId || !firestore || !organization) return;
    
    const ownerId = organization.ownerId;
    if (!ownerId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find the organization owner.'});
        return;
    }

    setIsSubmitting(true);
    
    const newSettlement: Omit<Settlement, 'id' | 'confirmedAt'> = {
      organizationId: organizationId,
      managerId: user.id,
      managerName: user.name,
      ownerId: ownerId, 
      amount: values.amount,
      status: 'pending',
      initiatedAt: serverTimestamp(),
    };

    const settlementsRef = collection(firestore, 'organizations', organizationId, 'settlements');
    addDocument(settlementsRef, newSettlement, 
      () => {
        toast({ title: 'Settlement Initiated', description: `A settlement request for BDT ${values.amount.toFixed(2)} has been sent to the owner.` });
        fetchSettlements(); // Refetch to show the new settlement
        form.reset();
        setIsSubmitting(false);
      },
      () => {
        setIsSubmitting(false);
      }
    );
  };

  const handleConfirmSettlement = (settlement: Settlement) => {
    if (!organizationId || !firestore) return;
    setConfirmingId(settlement.id);

    const settlementRef = doc(firestore, 'organizations', organizationId, 'settlements', settlement.id);
    const updateData = {
        status: 'confirmed' as const,
        confirmedAt: serverTimestamp(),
    };

    updateDocument(settlementRef, updateData, () => {
        toast({ title: 'Settlement Confirmed', description: 'The cash hand-off has been reconciled.' });
        setSettlements(prev => prev.map(s => s.id === settlement.id ? { ...s, ...updateData, status: 'confirmed' } : s));
        setConfirmingId(null);
    }, () => {
        toast({ variant: 'destructive', title: 'Confirmation Failed' });
        setConfirmingId(null);
    });
};

  const pageIsLoading = isLoading || isOrgLoading;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={<><HandCoins className="h-8 w-8"/> Cash Settlements</>}
        description="Initiate cash hand-offs to the owner and view historical settlements."
      />

      {hasRole('manager') && !hasRole('hospital_owner') && (
        <Card>
          <CardHeader>
            <CardTitle>Initiate a New Settlement</CardTitle>
            <CardDescription>Enter the total amount of cash you are handing over for settlement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Amount to Settle (BDT)</FormLabel>
                      <FormControl>
                        <CurrencyInput placeholder="e.g., 50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Initiate Settlement"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>A log of all past and pending cash settlements.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Initiated</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead>Amount (BDT)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Confirmed</TableHead>
                {hasRole('hospital_owner') && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageIsLoading ? (
                <TableRow><TableCell colSpan={hasRole('hospital_owner') ? 6 : 5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
              ) : settlements && settlements.length > 0 ? (
                settlements.map(settlement => (
                  <TableRow key={settlement.id}>
                    <TableCell><FormattedDate date={settlement.initiatedAt} formatString="dd-MM-yyyy, hh:mm a" /></TableCell>
                    <TableCell>{settlement.managerName}</TableCell>
                    <TableCell className="font-mono">{settlement.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={settlement.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{settlement.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {settlement.status === 'confirmed' && settlement.confirmedAt ? (
                        <FormattedDate date={settlement.confirmedAt} formatString="dd-MM-yyyy, hh:mm a" />
                      ) : 'N/A'}
                    </TableCell>
                    {hasRole('hospital_owner') && (
                        <TableCell className="text-right">
                            {settlement.status === 'pending' && (
                                <ConfirmationDialog
                                    trigger={
                                        <Button variant="outline" size="sm" disabled={confirmingId === settlement.id}>
                                            {confirmingId === settlement.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Confirm
                                        </Button>
                                    }
                                    title="Confirm Settlement?"
                                    description={`Are you sure you want to confirm the receipt of BDT ${settlement.amount.toFixed(2)} from ${settlement.managerName}? This action cannot be undone.`}
                                    onConfirm={() => handleConfirmSettlement(settlement)}
                                    confirmText="Yes, Confirm Receipt"
                                    isDestructive={false}
                                />
                            )}
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={hasRole('hospital_owner') ? 6 : 5} className="text-center h-24">No settlements found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="justify-center py-4">
            {hasMore && (
                <Button onClick={() => fetchSettlements(true)} disabled={isLoadingMore}>
                    {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
