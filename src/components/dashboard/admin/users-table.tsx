
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocument } from '@/firebase';
import { collection, doc, getDocs, query, orderBy, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Eye, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PAGE_SIZE = 20;

export function UsersTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const fetchUsers = async (loadMore = false) => {
        if (!firestore) return;

        if (loadMore) setIsLoadingMore(true); else setIsLoading(true);

        const usersRef = collection(firestore, 'users');
        let q;
        const queryConstraints = [
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
        ];

        if (loadMore && lastVisible) {
            q = query(usersRef, ...queryConstraints, startAfter(lastVisible));
        } else {
            q = query(usersRef, ...queryConstraints);
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newUsers = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            
            setHasMore(newUsers.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setUsers(prev => loadMore ? [...prev, ...newUsers] : newUsers);
        } catch (error) {
            console.error("Error fetching users: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch users." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchUsers();
    }, [firestore]);


    const handleUpdateUserStatus = (userId: string, status: 'active' | 'suspended') => {
        if (!firestore) return;
        setUpdatingId(userId);
        const userRef = doc(firestore, 'users', userId);
        const updateData = { status };
        
        updateDocument(userRef, updateData, () => {
            toast({ title: "User Status Updated", description: `User has been ${status}.` });
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status } : u));
            setUpdatingId(null);
        }, () => {
            setUpdatingId(null);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'The user status could not be updated.',
            });
        });
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, manage, and monitor all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Health ID</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                             users.map(user => (
                                 <TableRow key={user.id}>
                                     <TableCell>
                                         <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                         </div>
                                     </TableCell>
                                     <TableCell>{user.healthId}</TableCell>
                                     <TableCell><div className="flex flex-wrap gap-1">{user.roles.map(r => <Badge key={r} variant="secondary" className="capitalize">{r.replace(/_/g, ' ')}</Badge>)}</div></TableCell>
                                     <TableCell>
                                        <Badge variant={user.status === 'suspended' ? 'destructive' : 'default'} className="capitalize">{user.status || 'active'}</Badge>
                                     </TableCell>
                                     <TableCell className="text-right">
                                        {updatingId === user.id ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem asChild><Link href={`/dashboard/patients/${user.id}`}><Eye className="mr-2 h-4 w-4"/>View Profile</Link></DropdownMenuItem>
                                                    {user.status === 'suspended' ? (
                                                        <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'active')}><UserRoundCheck className="mr-2 h-4 w-4" />Activate User</DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, 'suspended')} className="text-destructive focus:text-destructive"><UserRoundX className="mr-2 h-4 w-4" />Suspend User</DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                     </TableCell>
                                 </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter className="justify-center py-4">
                {hasMore && (
                    <Button onClick={() => fetchUsers(true)} disabled={isLoadingMore}>
                        {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
