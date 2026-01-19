
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/use-auth"
import { useFirestore } from "@/firebase"
import { collection, query, where, orderBy, getDocs, limit, startAfter, type DocumentSnapshot } from "firebase/firestore"
import type { LabTestOrder, User } from "@/lib/definitions"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FlaskConical, Loader2 } from "lucide-react"
import { FormattedDate } from "@/components/shared/formatted-date"
import { Badge } from "@/components/ui/badge"
import { EnterResultsDialog } from "./lab/enter-results-dialog"
import { MyUpcomingShifts } from "./my-upcoming-shifts"
import { useToast } from '@/hooks/use-toast'
import { Button } from '../ui/button'

const PAGE_SIZE = 10;

export function LabTechnicianDashboard({ user }: { user: User }) {
    const { organizationId } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [pendingOrders, setPendingOrders] = useState<LabTestOrder[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = async (loadMore = false) => {
        if (!firestore || !organizationId) return;

        if (loadMore) setIsLoadingMore(true); else setIsLoading(true);

        const ordersRef = collection(firestore, 'organizations', organizationId, 'lab_test_orders');
        let q;
        const queryConstraints = [
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc'),
            limit(PAGE_SIZE)
        ];

        if (loadMore && lastVisible) {
            q = query(ordersRef, ...queryConstraints, startAfter(lastVisible));
        } else {
            q = query(ordersRef, ...queryConstraints);
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newOrders = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabTestOrder));
            
            setHasMore(newOrders.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setPendingOrders(prev => loadMore ? [...prev, ...newOrders] : newOrders);
        } catch (error) {
            console.error("Error fetching lab orders: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch lab orders." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [firestore, organizationId]);

    const handleResultsSaved = (orderId: string) => {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={<><FlaskConical className="h-8 w-8" /> Lab Dashboard</>}
                description={`Welcome, ${user.name}. View and process pending laboratory test orders.`}
            />

            <MyUpcomingShifts />

            <Card>
                <CardHeader>
                    <CardTitle>Pending Test Orders</CardTitle>
                    <CardDescription>
                        This is the queue of all lab tests waiting to be processed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Ordered By</TableHead>
                                    <TableHead>Tests Requested</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : pendingOrders && pendingOrders.length > 0 ? (
                                    pendingOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <FormattedDate date={order.createdAt} formatString="dd-MM-yyyy, hh:mm a" />
                                            </TableCell>
                                            <TableCell className="font-medium">{order.patientName}</TableCell>
                                            <TableCell>{order.doctorName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {order.tests.map(test => (
                                                        <Badge key={test} variant="secondary" className="w-fit">{test}</Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <EnterResultsDialog order={order} currentUser={user} onResultsSaved={() => handleResultsSaved(order.id)} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No pending test orders.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="justify-center py-4">
                    {hasMore && (
                        <Button onClick={() => fetchOrders(true)} disabled={isLoadingMore}>
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
