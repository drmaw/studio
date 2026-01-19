
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { OrganizationStats } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BedDouble, CalendarOff, PieChart } from 'lucide-react';
import { Pie, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { doc } from 'firebase/firestore';


function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}

export function OperationalReports() {
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

    const operationalStats = {
        occupancyRate: stats?.bedOccupancyRate ?? 0,
        alos: stats?.averageLengthOfStay ?? 0,
        totalBeds: stats?.totalBeds ?? 0,
        occupiedBeds: stats?.occupiedBeds ?? 0,
    };
    
    const occupancyData = [
        { name: 'Occupied', value: operationalStats.occupiedBeds },
        { name: 'Available', value: operationalStats.totalBeds - operationalStats.occupiedBeds }
    ];
    const COLORS = ['hsl(var(--destructive))', 'hsl(var(--primary))'];

    return (
        <div className="space-y-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <StatCard title="Bed Occupancy Rate" value={`${operationalStats.occupancyRate.toFixed(1)}%`} icon={BedDouble} />
                <StatCard title="Average Length of Stay (Days)" value={operationalStats.alos.toFixed(1)} icon={CalendarOff} />
            </div>
             <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><PieChart className="h-5 w-5" />Current Bed Status</h3>
                <p className="text-sm text-muted-foreground mb-4">Note: This is sample data. In a real application, this would be updated by a backend process.</p>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={occupancyData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {occupancyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} Beds`, name]} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
