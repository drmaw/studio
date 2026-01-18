
'use client';

import { useFirestore, useCollectionGroup, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { PrivacyLogEntry } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function GlobalAuditLog() {
    const firestore = useFirestore();
    const { data: logs, isLoading } = useCollectionGroup<PrivacyLogEntry>(
        useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'privacy_log'), orderBy('timestamp', 'desc')) : null, [firestore])
    );
    
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Global Privacy Audit Log</CardTitle>
                <CardDescription>A real-time log of all patient data access events across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-md h-[600px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-secondary">
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Patient ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoading ? <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                             logs?.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.timestamp ? formatDistanceToNow((log.timestamp as any).toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                    <TableCell>{log.actorName} ({log.actorId})</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{log.action}</Badge></TableCell>
                                    <TableCell>{log.patientId}</TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
