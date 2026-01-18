
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Organization } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function OrganizationsTable() {
    const firestore = useFirestore();
    const { data: organizations, isLoading } = useCollection<Organization>(useMemoFirebase(() => firestore ? collection(firestore, 'organizations') : null, [firestore]));

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
                                    <TableCell>{org.createdAt ? format((org.createdAt as any).toDate(), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                                    <TableCell><Badge variant={org.status === 'suspended' ? 'destructive' : 'default'} className="capitalize">{org.status}</Badge></TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">Manage</Button></TableCell>
                                </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
