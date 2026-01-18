
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Eye, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function UsersTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { data: users, isLoading } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));
    const [filter, setFilter] = useState('');

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => 
            u.name.toLowerCase().includes(filter.toLowerCase()) || 
            u.email.toLowerCase().includes(filter.toLowerCase()) ||
            u.healthId.includes(filter)
        );
    }, [users, filter]);

    const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended') => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { status });
        toast({ title: "User Status Updated", description: `User has been ${status}.` });
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, manage, and monitor all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Input placeholder="Filter by name, email, or Health ID..." value={filter} onChange={e => setFilter(e.target.value)} className="mb-4" />
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
                             filteredUsers.map(user => (
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
                                     </TableCell>
                                 </TableRow>
                             ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
