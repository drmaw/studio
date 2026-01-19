'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Facility, Bed } from '@/lib/definitions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, BedSingle, CheckCircle, User, XCircle, Wrench, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

function BedStatusCard({ bed }: { bed: Bed }) {
    const statusConfig = {
        available: {
            icon: CheckCircle,
            color: 'bg-green-100 text-green-800 border-green-200',
            label: 'Available',
        },
        occupied: {
            icon: User,
            color: 'bg-red-100 text-red-800 border-red-200',
            label: 'Occupied',
        },
        maintenance: {
            icon: Wrench,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            label: 'Maintenance',
        },
    };

    const config = statusConfig[bed.status] || statusConfig.maintenance;

    return (
        <div className={cn("p-4 rounded-lg border flex flex-col items-center justify-center text-center", config.color)}>
            <config.icon className="h-6 w-6 mb-2" />
            <p className="font-bold text-sm">{bed.id.replace('bed-', 'Bed ')}</p>
            <p className="text-xs">{config.label}</p>
            {bed.status === 'occupied' && <p className="text-xs font-medium mt-1 truncate max-w-full" title={bed.patientName}>{bed.patientName}</p>}
        </div>
    );
}

export default function BedManagementPage() {
    const { user, hasRole, loading: userLoading } = useAuth();
    const firestore = useFirestore();

    const facilitiesQuery = useMemoFirebase(() => {
        if (!user?.organizationId || !firestore) return null;
        return query(collection(firestore, 'organizations', user.organizationId, 'facilities'));
    }, [user?.organizationId, firestore]);

    const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);

    const isLoading = userLoading || facilitiesLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={<><BedDouble className="h-8 w-8" /> Bed Management</>}
                description="A real-time visual overview of all beds in your organization."
            />

            {facilities && facilities.length > 0 ? (
                <Accordion type="multiple" defaultValue={facilities.map(f => f.id)} className="w-full space-y-4">
                    {facilities.map(facility => (
                        <AccordionItem key={facility.id} value={facility.id} className="border-b-0">
                            <Card className="bg-background-soft">
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            {facility.type === 'ward' ? <BedDouble className="h-6 w-6 text-primary" /> : <BedSingle className="h-6 w-6 text-primary" />}
                                            <div>
                                                <h3 className="text-xl font-semibold text-left">{facility.name}</h3>
                                                <p className="text-sm text-muted-foreground text-left">{facility.totalBeds} Beds</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                                            {Object.values(facility.beds || {}).filter(b => b.status === 'available').length} Available
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                                        {Object.values(facility.beds || {}).map(bed => (
                                            <BedStatusCard key={bed.id} bed={bed} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                 <Card>
                    <CardContent className="p-0">
                        <EmptyState
                            icon={BedDouble}
                            message="No Facilities Found"
                            description="You haven't added any wards or cabins yet. Go to Hospital Settings to add facilities."
                            className="py-16"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
