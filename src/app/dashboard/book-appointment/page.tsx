
'use client'

import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Organization } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hospital, ArrowRight, BookOpenCheck } from "lucide-react";

export default function BookAppointmentPage() {

    const firestore = useFirestore();

    const orgsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query organizations, excluding individual patient "organizations"
        return query(collection(firestore, 'organizations'), where('ownerId', '!=', ''));
    }, [firestore]);

    const { data: organizations, isLoading: orgsLoading } = useCollection<Organization>(orgsQuery);

    const filteredOrgs = organizations?.filter(org => !org.id.startsWith('org-ind-'));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <BookOpenCheck className="h-8 w-8" />
                    Book an Appointment
                </h1>
                <p className="text-muted-foreground">
                    Find a hospital and book a consultation with a doctor.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgsLoading ? (
                    <>
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </>
                ) : filteredOrgs && filteredOrgs.length > 0 ? (
                    filteredOrgs.map(org => (
                        <Card key={org.id} className="bg-card hover:shadow-md transition-shadow flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hospital className="h-5 w-5 text-primary" />
                                    {org.name}
                                </CardTitle>
                                <CardDescription>{org.address}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1" />
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href={`/dashboard/book-appointment/${org.id}`}>
                                        View Doctors <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                        <p>No hospitals are available for booking at this time.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
