
'use client'

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useCollectionGroup } from '@/firebase';
import { collection, collectionGroup } from 'firebase/firestore';
import type { User, Organization, Appointment } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Building, Calendar, Loader2 } from 'lucide-react';

export function AdminStats() {
    const firestore = useFirestore();
    const { data: users } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));
    const { data: organizations } = useCollection<Organization>(useMemoFirebase(() => firestore ? collection(firestore, 'organizations') : null, [firestore]));
    const { data: appointments } = useCollectionGroup<Appointment>(useMemoFirebase(() => firestore ? collectionGroup(firestore, 'appointments') : null, [firestore]));
    
    const stats = useMemo(() => {
        const totalUsers = users?.length || 0;
        const totalDoctors = users?.filter(u => u.roles.includes('doctor')).length || 0;
        const totalOrgs = organizations?.length || 0;
        const totalAppointments = appointments?.length || 0;
        const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
        return { totalUsers, totalDoctors, totalOrgs, totalAppointments, pendingAppointments };
    }, [users, organizations, appointments]);

    const statCards = [
        { title: "Total Users", value: stats.totalUsers, icon: Users },
        { title: "Total Doctors", value: stats.totalDoctors, icon: Briefcase },
        { title: "Total Organizations", value: stats.totalOrgs, icon: Building },
        { title: "Total Appointments", value: stats.totalAppointments, icon: Calendar },
        { title: "Pending Appointments", value: stats.pendingAppointments, icon: Loader2, className: "text-amber-600" },
    ];

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
