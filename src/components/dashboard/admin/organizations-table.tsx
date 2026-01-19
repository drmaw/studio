
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, getDocs, collection, query, orderBy, limit, startAfter, type DocumentSnapshot } from '@/firebase';
import type { Organization } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FormattedDate } from '@/components/shared/formatted-date';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

export function OrganizationsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrganizations = async (loadMore = false) => {
        if (!firestore) return;

        if (loadMore) setIsLoadingMore(true); else setIsLoading(true);

        const orgsRef = collection(firestore, 'organizations');
        let q;
        const queryConstraints = [
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
        ];

        if (loadMore && lastVisible) {
            q = query(orgsRef, ...queryConstraints, startAfter(lastVisible));
        } else {
            q = query(orgsRef, ...queryConstraints);
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newOrgs = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));
            
            setHasMore(newOrgs.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setOrganizations(prev => loadMore ? [...prev, ...newOrgs] : newOrgs);
        } catch (error) {
            console.error("Error fetching organizations: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch organizations." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchOrganizations();
    }, [firestore]);


    return (
        <Card className="mt-4">
             <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>Manage all registered healthcare organizations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Owner ID</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoading ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                             organizations?.map(org => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell>{org.ownerId}</TableCell>
                                    <TableCell><FormattedDate date={org.createdAt} formatString="dd-MM-yyyy" fallback="N/A" /></TableCell>
                                    <TableCell><Badge variant={org.status === 'suspended' ? 'destructive' : 'default'} className="capitalize">{org.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/settings/hospital?orgId=${org.id}`}>Manage</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="justify-center py-4">
                {hasMore && (
                    <Button onClick={() => fetchOrganizations(true)} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
