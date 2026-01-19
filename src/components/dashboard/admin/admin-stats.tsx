
'use client'

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { PlatformStats } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Building, Calendar, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

export function AdminStats() {
    const firestore = useFirestore();
    
    const statsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'stats', 'platform') : null, [firestore]);
    const { data: stats, isLoading } = useDoc<PlatformStats>(statsDocRef);

    const statCards = [
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users },
        { title: "Total Doctors", value: stats?.totalDoctors ?? 0, icon: Briefcase },
        { title: "Total Organizations", value: stats?.totalOrganizations ?? 0, icon: Building },
        { title: "Total Appointments", value: stats?.totalAppointments ?? 0, icon: Calendar },
        { title: "Pending Appointments", value: stats?.pendingAppointments ?? 0, icon: Loader2, className: "text-amber-600" },
    ];

    if (isLoading && !stats) {
         return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
                {statCards.map(card => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 text-muted-foreground ${card.className || ''}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
            {statCards.map(card => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 text-muted-foreground ${card.className || ''}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
