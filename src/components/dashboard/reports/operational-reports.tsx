
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Admission, Facility } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BedDouble, CalendarOff, PieChart } from 'lucide-react';
import { Pie, ResponsiveContainer, Cell, Legend } from 'recharts';

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

    const facilitiesQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, 'organizations', organizationId, 'facilities'));
    }, [firestore, organizationId]);
    const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);

    const admissionsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, 'organizations', organizationId, 'admissions'));
    }, [firestore, organizationId]);
    const { data: admissions, isLoading: admissionsLoading } = useCollection<Admission>(admissionsQuery);

    const isLoading = facilitiesLoading || admissionsLoading;

    const operationalStats = useMemo(() => {
        if (!facilities || !admissions) return { occupancyRate: 0, alos: 0, totalBeds: 0, occupiedBeds: 0 };
        
        // Bed Occupancy
        const totalBeds = facilities.reduce((acc, facility) => acc + facility.totalBeds, 0);
        const occupiedBeds = facilities.reduce((acc, facility) => {
            return acc + Object.values(facility.beds || {}).filter(b => b.status === 'occupied').length;
        }, 0);
        const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

        // Average Length of Stay (ALOS)
        const dischargedAdmissions = admissions.filter(a => a.status === 'discharged' && a.dischargeDate && a.admissionDate);
        const totalStayDuration = dischargedAdmissions.reduce((acc, admission) => {
            const admissionDate = (admission.admissionDate as any).toDate();
            const dischargeDate = (admission.dischargeDate as any).toDate();
            const duration = dischargeDate.getTime() - admissionDate.getTime();
            return acc + duration;
        }, 0);
        const alos = dischargedAdmissions.length > 0 ? (totalStayDuration / dischargedAdmissions.length) / (1000 * 60 * 60 * 24) : 0;
        
        return { occupancyRate, alos, totalBeds, occupiedBeds };

    }, [facilities, admissions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
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
