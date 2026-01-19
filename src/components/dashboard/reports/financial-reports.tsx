
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Invoice } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

function StatCard({ title, value, icon: Icon, formatAsCurrency = true }: { title: string, value: number, icon: React.ElementType, formatAsCurrency?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatAsCurrency ? `BDT ${value.toLocaleString()}` : value}
                </div>
            </CardContent>
        </Card>
    );
}

export function FinancialReports() {
    const { organizationId } = useAuth();
    const firestore = useFirestore();

    const invoicesQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, 'organizations', organizationId, 'invoices'));
    }, [firestore, organizationId]);

    const { data: invoices, isLoading } = useCollection<Invoice>(invoicesQuery);

    const financialStats = useMemo(() => {
        if (!invoices) return { totalRevenue: 0, outstandingBalance: 0, voidInvoices: 0, dailyRevenue: [] };

        const stats = {
            totalRevenue: 0,
            outstandingBalance: 0,
            voidInvoices: 0,
        };

        const dailyRevenueMap = new Map<string, number>();
        const thirtyDaysAgo = subDays(new Date(), 30);

        invoices.forEach(invoice => {
            if (invoice.status === 'paid') {
                stats.totalRevenue += invoice.totalAmount;
                const invoiceDate = (invoice.createdAt as any)?.toDate();
                if (invoiceDate && invoiceDate > thirtyDaysAgo) {
                    const dateString = format(invoiceDate, 'yyyy-MM-dd');
                    dailyRevenueMap.set(dateString, (dailyRevenueMap.get(dateString) || 0) + invoice.totalAmount);
                }
            } else if (invoice.status === 'open') {
                stats.outstandingBalance += invoice.totalAmount;
            } else if (invoice.status === 'void') {
                stats.voidInvoices += 1;
            }
        });
        
        const dailyRevenue = Array.from(dailyRevenueMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { ...stats, dailyRevenue };
    }, [invoices]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Revenue (Paid)" value={financialStats.totalRevenue} icon={DollarSign} />
                <StatCard title="Outstanding Balance (Open)" value={financialStats.outstandingBalance} icon={AlertCircle} />
                <StatCard title="Voided Invoices" value={financialStats.voidInvoices} icon={CheckCircle} formatAsCurrency={false} />
            </div>

            <div>
                <h3 className="text-lg font-medium mb-4">Revenue Over Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialStats.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        />
                        <YAxis tickFormatter={(val) => `BDT ${val/1000}k`} />
                        <Tooltip
                             formatter={(value) => [`BDT ${Number(value).toLocaleString()}`, 'Revenue']}
                             labelFormatter={(label) => format(new Date(label), 'PPP')}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Daily Revenue" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
