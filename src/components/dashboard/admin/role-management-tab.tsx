
'use client'

import { useState } from 'react';
import { useFirestore, useCollectionGroup, useMemoFirebase, commitBatch, updateDocument } from '@/firebase';
import { collectionGroup, query, where, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Role, RoleApplication, RoleRemovalRequest, User, Organization } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { UserPlus, UserX, Loader2, Calendar, Building, Check, X, Trash2 } from 'lucide-react';
import { FormattedDate } from '@/components/shared/formatted-date';
import { createNotification } from '@/lib/notifications';


function RejectApplicationDialog({ application, onReject }: { application: RoleApplication, onReject: (app: RoleApplication, reason: string) => void }) {
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
                        <AvatarFallback>{application.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Applied: <FormattedDate date={application.createdAt} formatString="dd-MM-yyyy, hh:mm a" fallback="N/A" /></span></div>
                    {application.requestedRole === 'hospital_owner' && application.details?.organization && (
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
                        <AvatarFallback>{request.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Requested: <FormattedDate date={request.createdAt} formatString="dd-MM-yyyy, hh:mm a" fallback="N/A" /></span></div>
                </div>
                 <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onReject(request)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                    <Button variant="destructive" size="sm" onClick={() => onApprove(request)}><Trash2 className="mr-2 h-4 w-4" /> Approve Removal</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function RoleManagementTab() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'role_applications'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: applications, isLoading: appsLoading } = useCollectionGroup<RoleApplication>(applicationsQuery);

    const removalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'role_removal_requests'), where('status', '==', 'pending'));
    }, [firestore]);

    const { data: removalRequests, isLoading: removalsLoading } = useCollectionGroup<RoleRemovalRequest>(removalsQuery);
    
    const handleApproveApplication = async (app: RoleApplication) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        const appRef = doc(firestore, 'users', app.userId, 'role_applications', app.id);
        batch.update(appRef, { status: 'approved', reviewedAt: serverTimestamp() });

        const userRef = doc(firestore, 'users', app.userId);
        const userDocSnap = await getDoc(userRef);
        
        if (userDocSnap.exists()) {
            const userDoc = userDocSnap.data() as User;
            const currentRoles = userDoc.roles || [];
            const newRoles = Array.from(new Set([...currentRoles, app.requestedRole]));
            batch.update(userRef, { roles: newRoles });

             // If approving a hospital owner, create the organization
            if (app.requestedRole === 'hospital_owner' && app.details?.organization) {
                const orgCollectionRef = collection(firestore, 'organizations');
                const orgRef = doc(orgCollectionRef); // Auto-generate ID
                const newOrg: Omit<Organization, 'id'> = {
                    name: app.details.organization.name,
                    address: app.details.organization.address,
                    registrationNumber: app.details.organization.reg,
                    tin: app.details.organization.tin,
                    ownerId: app.userId,
                    status: 'active',
                    createdAt: serverTimestamp(),
                };
                batch.set(orgRef, newOrg);
                // Update the user's orgId to the new one
                batch.update(userRef, { organizationId: orgRef.id });
            }
        }
        
        const success = await commitBatch(batch, `approve role application for ${app.userId}`);
        
        if (success) {
            await createNotification(firestore, app.userId, 'Application Approved', `Your application for the ${app.requestedRole.replace(/_/g, ' ')} role has been approved.`, '/dashboard/profile');
            toast({ title: 'Application Approved', description: `${app.userName} is now a ${app.requestedRole}.` });
        }
    };

    const handleRejectApplication = async (app: RoleApplication, reason: string) => {
        if (!firestore) return;
        const appRef = doc(firestore, 'users', app.userId, 'role_applications', app.id);
        const updateData = { status: 'rejected', reason: reason, reviewedAt: serverTimestamp() };
        
        const success = await updateDocument(appRef, updateData);
        
        if (success) {
            await createNotification(firestore, app.userId, 'Application Rejected', `Your application for the ${app.requestedRole.replace(/_/g, ' ')} role has been rejected.`, '/dashboard/profile');
            toast({ variant: 'destructive', title: 'Application Rejected' });
        }
    };

    const handleApproveRemoval = async (req: RoleRemovalRequest) => {
        if (!firestore) return;
        const batch = writeBatch(firestore);

        const requestRef = doc(firestore, 'users', req.userId, 'role_removal_requests', req.id);
        batch.update(requestRef, { status: 'approved', reviewedAt: serverTimestamp() });

        const userRef = doc(firestore, 'users', req.userId);
        const userDocSnap = await getDoc(userRef);

        if (userDocSnap.exists()) {
            const userDoc = userDocSnap.data() as User;
            const newRoles = (userDoc.roles || []).filter((r: Role) => r !== req.roleToRemove);
            batch.update(userRef, { roles: newRoles });
        }
        
        const success = await commitBatch(batch, `approve role removal for ${req.userId}`);
        
        if (success) {
            await createNotification(firestore, req.userId, 'Role Removed', `Your ${req.roleToRemove.replace(/_/g, ' ')} role has been successfully removed.`, '/dashboard/profile');
            toast({ title: 'Role Removal Approved' });
        }
    };

    const handleRejectRemoval = async (req: RoleRemovalRequest) => {
        if (!firestore) return;
        const requestRef = doc(firestore, 'users', req.userId, 'role_removal_requests', req.id);
        const updateData = { status: 'rejected', reviewedAt: serverTimestamp() };
        
        const success = await updateDocument(requestRef, updateData);

        if (success) {
            await createNotification(firestore, req.userId, 'Role Removal Rejected', `Your request to remove the ${req.roleToRemove.replace(/_/g, ' ')} role has been rejected.`, '/dashboard/profile');
            toast({ variant: 'destructive', title: 'Role Removal Rejected' });
        }
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
