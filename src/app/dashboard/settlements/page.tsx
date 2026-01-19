'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocument } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Settlement, Organization } from '@/lib/definitions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { HandCoins, Loader2 } from 'lucide-react';
import { CurrencyInput } from '@/components/shared/currency-input';
import { FormattedDate } from '@/components/shared/formatted-date';

const settlementSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than zero." }),
});

export default function SettlementsPage() {
  const { user, hasRole } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organizationId = user?.organizationId;

  const orgDocRef = useMemoFirebase(() => {
    if(!firestore || !organizationId) return null;
    return doc(firestore, 'organizations', organizationId);
  }, [firestore, organizationId]);
  const { data: organization, isLoading: isOrgLoading } = useDoc<Organization>(orgDocRef);

  const form = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: { amount: 0 },
  });

  const settlementsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, 'organizations', organizationId, 'settlements'), orderBy('initiatedAt', 'desc'));
  }, [firestore, organizationId]);

  const { data: settlements, isLoading: isSettlementsLoading } = useCollection<Settlement>(settlementsQuery);

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
        form.reset();
        setIsSubmitting(false);
      },
      () => {
        setIsSubmitting(false);
      }
    );
  };

  const isLoading = isSettlementsLoading || isOrgLoading;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={<><HandCoins className="h-8 w-8"/> Cash Settlements</>}
        description="Initiate cash hand-offs to the owner and view historical settlements."
      />

      {hasRole('manager') && (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
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
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No settlements found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
