
'use client'

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, UserCheck, UserX, Loader2, Check, X, Building, Calendar, BadgeInfo, FileText, UserPlus, Trash2, Users, Briefcase, BarChart, ShieldAlert, MoreHorizontal, Eye, UserRoundCheck, UserRoundX } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useCollectionGroup } from '@/firebase';
import { collection, collectionGroup, query, where, doc, writeBatch, serverTimestamp, addDoc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import type { Role, RoleApplication, RoleRemovalRequest, User, Organization, PrivacyLogEntry, Appointment } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// #region Helper Functions & Components
async function createNotification(firestore: any, userId: string, title: string, description: string, href?: string) {
    const notificationsRef = collection(firestore, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
        userId,
        title,
        description,
        href: href || '#',
        isRead: false,
        createdAt: serverTimestamp(),
    });
}
// #endregion

// #region Role Management Components
function RejectApplicationDialog({ application, onReject }: { application: RoleApplication, onReject: (app: RoleApplication, reason: string) => Promise<void> }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReject = async () => {
        if (!reason) return;
        setIsSubmitting(true);
        await onReject(application, reason);
        setIsSubmitting(false);
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm"><X className="mr-2 h-4 w-4" /> Reject</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Application?</DialogTitle>
                    <DialogDescription>
                        Provide a reason for rejecting {application.userName}'s application for the {application.requestedRole} role.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="reason">Reason for Rejection</Label>
                    <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Incomplete documentation..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !reason}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ApplicationCard({ application, onApprove, onReject }: { application: RoleApplication, onApprove: (app: RoleApplication) => void, onReject: (app: RoleApplication, reason: string) => void }) {
    return (
        <Card className="bg-background">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback>{application.userName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">{application.userName}</CardTitle>
                        <CardDescription className="text-xs">User ID: {application.userId}</CardDescription>
                    </div>
                </div>
                <Badge className="capitalize">{application.requestedRole.replace(/_/g, ' ')}</Badge>
            </CardHeader>
            <CardContent>
                <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Applied: {format((application.createdAt as any).toDate(), 'dd-MM-yyyy, hh:mm a')}</span></div>
                    {application.requestedRole === 'hospital_owner' && (
                        <Card className="p-3 bg-background-soft">
                            <h4 className="font-semibold text-xs mb-2 flex items-center gap-2"><Building className="h-4 w-4" /> Proposed Organization</h4>
                            <p className="text-xs"><span className="font-medium">Name:</span> {application.details.organization.name}</p>
                            <p className="text-xs"><span className="font-medium">Address:</span> {application.details.organization.address}</p>
                        </Card>
                    )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <RejectApplicationDialog application={application} onReject={onReject} />
                    <Button size="sm" onClick={() => onApprove(application)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                </div>
            </CardContent>
        </Card>
    )
}

function RemovalRequestCard({ request, onApprove, onReject }: { request: RoleRemovalRequest, onApprove: (req: RoleRemovalRequest) => void, onReject: (req: RoleRemovalRequest) => void }) {
    return (
         <Card className="bg-background">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Avatar className="h-12 w-12">
                        <AvatarFallback>{request.userName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">{request.userName}</CardTitle>
                        <CardDescription className="text-xs">User ID: {request.userId}</CardDescription>
                    </div>
                </div>
                 <Badge variant="destructive" className="capitalize">Remove: {request.roleToRemove.replace(/_/g, ' ')}</Badge>
            </CardHeader>
            <CardContent>
                <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Requested: {format((request.createdAt as any).toDate(), 'dd-MM-yyyy, hh:mm a')}</span></div>
                </div>
                 <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onReject(request)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                    <Button variant="destructive" size="sm" onClick={() => onApprove(request)}><Trash2 className="mr-2 h-4 w-4" /> Approve Removal</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function RoleManagementTab() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'role_applications'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: applications, isLoading: appsLoading } = useCollection<RoleApplication>(applicationsQuery);

    const removalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'role_removal_requests'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: removalRequests, isLoading: removalsLoading } = useCollection<RoleRemovalRequest>(removalsQuery);
    
    const handleApproveApplication = async (app: RoleApplication) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        const appRef = doc(firestore, 'users', app.userId, 'role_applications', app.id);
        batch.update(appRef, { status: 'approved', reviewedAt: serverTimestamp() });

        const userRef = doc(firestore, 'users', app.userId);
        const userDoc = (await getDoc(userRef)).data() as User;
        
        if (userDoc) {
            const currentRoles = userDoc.roles || [];
            const newRoles = Array.from(new Set([...currentRoles, app.requestedRole]));
            batch.update(userRef, { roles: newRoles });

             // If approving a hospital owner, create the organization
            if (app.requestedRole === 'hospital_owner') {
                const orgCollectionRef = collection(firestore, 'organizations');
                const orgRef = doc(orgCollectionRef); // Auto-generate ID
                const newOrg: Omit<Organization, 'id'> = {
                    name: app.details.organization.name,
                    address: app.details.organization.address,
                    ownerId: app.userId,
                    status: 'active',
                    createdAt: serverTimestamp(),
                };
                batch.set(orgRef, newOrg);
                // Update the user's orgId to the new one
                batch.update(userRef, { organizationId: orgRef.id });
            }
        }
        
        await batch.commit();

        await createNotification(firestore, app.userId, 'Application Approved', `Your application for the ${app.requestedRole.replace(/_/g, ' ')} role has been approved.`, '/dashboard/profile');
        toast({ title: 'Application Approved', description: `${app.userName} is now a ${app.requestedRole}.` });
    };

    const handleRejectApplication = async (app: RoleApplication, reason: string) => {
        if (!firestore) return;
        const appRef = doc(firestore, 'users', app.userId, 'role_applications', app.id);
        await updateDoc(appRef, { status: 'rejected', reason: reason, reviewedAt: serverTimestamp() });
        
        await createNotification(firestore, app.userId, 'Application Rejected', `Your application for the ${app.requestedRole.replace(/_/g, ' ')} role has been rejected.`, '/dashboard/profile');
        toast({ variant: 'destructive', title: 'Application Rejected' });
    };

    const handleApproveRemoval = async (req: RoleRemovalRequest) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);

        const requestRef = doc(firestore, 'users', req.userId, 'role_removal_requests', req.id);
        batch.update(requestRef, { status: 'approved', reviewedAt: serverTimestamp() });

        const userRef = doc(firestore, 'users', req.userId);
        const userDoc = (await getDoc(userRef)).data() as User;

        if (userDoc) {
            const newRoles = (userDoc.roles || []).filter((r: Role) => r !== req.roleToRemove);
            batch.update(userRef, { roles: newRoles });
        }
        await batch.commit();
        await createNotification(firestore, req.userId, 'Role Removed', `Your ${req.roleToRemove.replace(/_/g, ' ')} role has been successfully removed.`, '/dashboard/profile');
        toast({ title: 'Role Removal Approved' });
    };

    const handleRejectRemoval = async (req: RoleRemovalRequest) => {
        if (!firestore) return;
        const requestRef = doc(firestore, 'users', req.userId, 'role_removal_requests', req.id);
        await updateDoc(requestRef, { status: 'rejected', reviewedAt: serverTimestamp() });
        await createNotification(firestore, req.userId, 'Role Removal Rejected', `Your request to remove the ${req.roleToRemove.replace(/_/g, ' ')} role has been rejected.`, '/dashboard/profile');
        toast({ variant: 'destructive', title: 'Role Removal Rejected' });
    };

    const isLoading = appsLoading || removalsLoading;

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus />Pending Role Applications</CardTitle>
                    <CardDescription>Review and approve or reject new role applications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> :
                     applications && applications.length > 0 ? (
                        <div className="space-y-4">
                            {applications.map(app => (
                                <ApplicationCard key={app.id} application={app} onApprove={handleApproveApplication} onReject={handleRejectApplication} />
                            ))}
                        </div>
                     ) : (
                         <p className="text-center text-muted-foreground py-8">No pending applications.</p>
                     )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserX />Pending Role Removals</CardTitle>
                    <CardDescription>Review requests to remove professional roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> :
                     removalRequests && removalRequests.length > 0 ? (
                         <div className="space-y-4">
                            {removalRequests.map(req => (
                                <RemovalRequestCard key={req.id} request={req} onApprove={handleApproveRemoval} onReject={handleRejectRemoval} />
                            ))}
                        </div>
                     ) : (
                        <p className="text-center text-muted-foreground py-8">No pending removal requests.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    )
}
// #endregion

// #region Stats Components
function AdminStats() {
    const firestore = useFirestore();
    const { data: users } = useCollection<User>(useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]));
    const { data: organizations } = useCollection<Organization>(useMemoFirebase(() => firestore ? collection(firestore, 'organizations') : null, [firestore]));
    const { data: appointments } = useCollectionGroup<Appointment>(useMemoFirebase(() => firestore ? collectionGroup(firestore, 'appointments') : null, [firestore]));
    
    const stats = useMemo(() => {
        const totalUsers = users?.length || 0;
        const totalDoctors = users?.filter(u => u.roles.includes('doctor')).length || 0;
        const totalOrgs = organizations?.length || 0;
        const totalAppointments = appointments?.length || 0;
        const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
        return { totalUsers, totalDoctors, totalOrgs, totalAppointments, pendingAppointments };
    }, [users, organizations, appointments]);

    const statCards = [
        { title: "Total Users", value: stats.totalUsers, icon: Users },
        { title: "Total Doctors", value: stats.totalDoctors, icon: Briefcase },
        { title: "Total Organizations", value: stats.totalOrgs, icon: Building },
        { title: "Total Appointments", value: stats.totalAppointments, icon: Calendar },
        { title: "Pending Appointments", value: stats.pendingAppointments, icon: Loader2, className: "text-amber-600" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
            {statCards.map(card => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 text-muted-foreground ${card.className || ''}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
// #endregion

// #region User Management Components
function UsersTable() {
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
                                            <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{user.name.slice(0,1)}</AvatarFallback></Avatar>
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
// #endregion

// #region Organizations Tab
function OrganizationsTable() {
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
// #endregion

// #region Audit Log Tab
function GlobalAuditLog() {
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
// #endregion


export default function AdminDashboardPage() {
    const { user, hasRole, loading } = useAuth();
    const router = useRouter();

    if (!loading && user && !hasRole('admin')) {
        router.replace('/dashboard');
        return null;
    }
    
    if (loading || !user) {
        return <Skeleton className="h-screen w-full" />
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <UserCog className="h-8 w-8" />
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">Monitor and manage the entire Digi Health platform.</p>
            </div>
            
            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview"><BarChart className="mr-2 h-4 w-4"/>Overview</TabsTrigger>
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Users</TabsTrigger>
                    <TabsTrigger value="roles"><Briefcase className="mr-2 h-4 w-4"/>Role Mgmt</TabsTrigger>
                    <TabsTrigger value="organizations"><Building className="mr-2 h-4 w-4"/>Orgs</TabsTrigger>
                    <TabsTrigger value="audit"><ShieldAlert className="mr-2 h-4 w-4"/>Audit Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <AdminStats />
                </TabsContent>
                <TabsContent value="users">
                    <UsersTable />
                </TabsContent>
                <TabsContent value="roles">
                    <RoleManagementTab />
                </TabsContent>
                <TabsContent value="organizations">
                    <OrganizationsTable />
                </TabsContent>
                <TabsContent value="audit">
                    <GlobalAuditLog />
                </TabsContent>
            </Tabs>

        </div>
    )
}
