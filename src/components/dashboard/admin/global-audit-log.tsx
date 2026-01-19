'use client';

import { useState, useEffect } from 'react';
import { useFirestore, getDocs, collectionGroup, query, orderBy, limit, startAfter, type DocumentSnapshot } from '@/firebase';
import type { PrivacyLogEntry } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FormattedDate } from '@/components/shared/formatted-date';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

export function GlobalAuditLog() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [logs, setLogs] = useState<PrivacyLogEntry[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchLogs = async (loadMore = false) => {
        if (!firestore) return;

        if (loadMore) setIsLoadingMore(true); else setIsLoading(true);

        const logsRef = collectionGroup(firestore, 'privacy_log');
        let q;
        const queryConstraints = [
            orderBy('timestamp', 'desc'),
            limit(PAGE_SIZE)
        ];

        if (loadMore && lastVisible) {
            q = query(logsRef, ...queryConstraints, startAfter(lastVisible));
        } else {
            q = query(logsRef, ...queryConstraints);
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newLogs = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrivacyLogEntry));
            
            setHasMore(newLogs.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setLogs(prev => loadMore ? [...prev, ...newLogs] : newLogs);
        } catch (error) {
            console.error("Error fetching audit logs: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch audit logs." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchLogs();
    }, [firestore]);
    
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Global Privacy Audit Log</CardTitle>
                <CardDescription>A log of all patient data access events across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-md h-[600px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-secondary z-10">
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Patient ID</TableHead>
                                <TableHead>Org ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoading ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                             logs?.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell><FormattedDate date={log.timestamp} formatString="dd-MM-yyyy, hh:mm a" fallback="N/A" /></TableCell>
                                    <TableCell>{log.actorName} ({log.actorId})</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{log.action.replace(/_/g, ' ')}</Badge></TableCell>
                                    <TableCell>{log.patientId}</TableCell>
                                    <TableCell>{log.organizationId}</TableCell>
                                </TableRow>
                             ))}
                             {!isLoading && logs.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No audit logs found.</TableCell></TableRow>
                             )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="justify-center py-4">
                {hasMore && (
                    <Button onClick={() => fetchLogs(true)} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
