
'use client'

import { useAuth } from "@/hooks/use-auth"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import type { LabTestOrder, User } from "@/lib/definitions"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FlaskConical, Loader2 } from "lucide-react"
import { FormattedDate } from "@/components/shared/formatted-date"
import { Badge } from "@/components/ui/badge"
import { EnterResultsDialog } from "./lab/enter-results-dialog"
import { MyUpcomingShifts } from "./my-upcoming-shifts"

export function LabTechnicianDashboard({ user }: { user: User }) {
    const { organizationId } = useAuth();
    const firestore = useFirestore();

    const pendingOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(
            collection(firestore, 'organizations', organizationId, 'lab_test_orders'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, organizationId]);

    const { data: pendingOrders, isLoading } = useCollection<LabTestOrder>(pendingOrdersQuery);

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
                                                <EnterResultsDialog order={order} currentUser={user} />
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
            </Card>
        </div>
    )
}
