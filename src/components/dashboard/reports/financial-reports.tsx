
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { OrganizationStats } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { doc } from 'firebase/firestore';

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

    // In a real-world app, this summary doc would be updated by backend Cloud Functions.
    // Here we read from it directly for maximum UI performance.
    const statsDocRef = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return doc(firestore, 'organizations', organizationId, 'stats', 'summary');
    }, [firestore, organizationId]);

    const { data: stats, isLoading } = useDoc<OrganizationStats>(statsDocRef);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const financialStats = {
        totalRevenue: stats?.totalRevenue ?? 0,
        outstandingBalance: stats?.outstandingBalance ?? 0,
        voidInvoices: stats?.voidInvoices ?? 0,
        dailyRevenue: stats?.dailyRevenue ?? []
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Revenue (Paid)" value={financialStats.totalRevenue} icon={DollarSign} />
                <StatCard title="Outstanding Balance (Open)" value={financialStats.outstandingBalance} icon={AlertCircle} />
                <StatCard title="Voided Invoices" value={financialStats.voidInvoices} icon={CheckCircle} formatAsCurrency={false} />
            </div>

            <div>
                <h3 className="text-lg font-medium mb-4">Revenue Over Last 30 Days</h3>
                <p className="text-sm text-muted-foreground mb-4">Note: This is sample data. In a real application, this would be updated by a backend process.</p>
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
