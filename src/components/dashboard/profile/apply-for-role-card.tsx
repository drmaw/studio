
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase, addDocument } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import type { Role, RoleApplication, RoleRemovalRequest } from '@/lib/definitions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, IdCard, File, Building, Hash, MapPin, Loader2, Clock, CheckCircle, Trash2, Info } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FormattedDate } from '@/components/shared/formatted-date';
import { applicationRoles, professionalRolesConfig } from '@/lib/roles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export function ApplyForRoleCard() {
  const { user, loading: userLoading } = useAuth();
  const firestore = useFirestore();
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [orgDetails, setOrgDetails] = useState({ name: '', reg: '', tin: '', address: '' });

  const applicationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.id, 'role_applications');
  }, [user, firestore]);

  const { data: applications, isLoading: applicationsLoading } = useCollection<RoleApplication>(applicationsQuery);
  
  const removalRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.id, 'role_removal_requests');
  }, [user, firestore]);

  const { data: removalRequests, isLoading: removalRequestsLoading } = useCollection<RoleRemovalRequest>(removalRequestsQuery);

  const allRoleActivities = useMemo(() => {
    const creationActivities = (applications || []).map(app => ({
      id: app.id,
      type: 'creation' as const,
      role: app.requestedRole,
      status: app.status,
      createdAt: app.createdAt,
      reviewedAt: app.reviewedAt,
      reason: app.reason,
    }));

    const removalActivities = (removalRequests || []).map(req => ({
      id: req.id,
      type: 'removal' as const,
      role: req.roleToRemove,
      status: req.status,
      createdAt: req.createdAt,
      reviewedAt: req.reviewedAt,
      reason: undefined,
    }));

    const combined = [...creationActivities, ...removalActivities];

    combined.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt as any).toDate() : new Date(0);
      const dateB = b.createdAt ? (b.createdAt as any).toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return combined;
  }, [applications, removalRequests]);


  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole || !user || !firestore) {
      toast({
        variant: "destructive",
        title: "No Role Selected",
        description: "Please select a role to apply for.",
      });
      return;
    }

    const hasRole = user.roles.includes(selectedRole as Role);
    const pendingApp = applications?.find(app => app.requestedRole === selectedRole && app.status === 'pending');

    if (hasRole || pendingApp) {
        toast({ title: "Not so fast!", description: "You either have this role or an application is already pending." });
        return;
    }

    setIsSubmitting(true);
    
    const applicationDetails: any = {};
    if (selectedRole === 'hospital_owner') {
        applicationDetails.organization = orgDetails;
    }

    const applicationsRef = collection(firestore, 'users', user.id, 'role_applications');
    
    const newApplication: Omit<RoleApplication, 'id' | 'reason'> = {
        userId: user.id,
        userName: user.name,
        requestedRole: selectedRole as Role,
        status: 'pending',
        details: applicationDetails,
        createdAt: serverTimestamp(),
    };

    addDocument(applicationsRef, newApplication, (docRef) => {
        if (docRef) {
            toast({
                title: "Application Submitted",
                description: `Your application for the ${selectedRole.replace(/_/g, ' ')} role is now pending review.`,
            });
        }
        setIsSubmitting(false);
    });
  };

  const handleRequestRoleRemoval = (roleToDelete: Role) => {
    if (!user || !firestore) return;

    // Prevent removing the essential 'patient' role
    if (roleToDelete === 'patient') {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "The patient role cannot be removed."});
        return;
    }

    // Check if a removal request for this role is already pending.
    const pendingRemoval = removalRequests?.find(req => req.roleToRemove === roleToDelete && req.status === 'pending');
    if (pendingRemoval) {
        toast({ title: "Request Already Pending", description: `A request to remove the ${roleToDelete.replace(/_/g, ' ')} role is already being reviewed.` });
        return;
    }

    const removalRequestsRef = collection(firestore, 'users', user.id, 'role_removal_requests');
    const newRemovalRequest: Omit<RoleRemovalRequest, 'id'> = {
        userId: user.id,
        userName: user.name,
        roleToRemove: roleToDelete,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
    };
    
    addDocument(removalRequestsRef, newRemovalRequest, (docRef) => {
        if (docRef) {
            toast({
                title: "Removal Request Submitted",
                description: `Your request to remove the ${roleToDelete.replace(/_/g, ' ')} role is now pending admin review.`,
            });
        }
    });
  };
  
  const renderRoleForm = () => {
    switch(selectedRole) {
      case 'doctor':
        return (
          <div className="space-y-4">
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Feature Coming Soon</AlertTitle>
                <AlertDescription>
                    Document uploads are not yet implemented. Your application will be submitted for review without attachments.
                </AlertDescription>
            </Alert>
             <div className="space-y-2">
              <Label htmlFor="bmdc" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> BMDC Registration Number</Label>
              <Input id="bmdc" placeholder="Enter your BMDC number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Picture</Label>
              <Input id="doctor-photo" type="file" disabled />
            </div>
          </div>
        );
      case 'nurse':
        return (
            <div className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Feature Coming Soon</AlertTitle>
                    <AlertDescription>
                        Document uploads are not yet implemented. Your application will be submitted for review without attachments.
                    </AlertDescription>
                </Alert>
                <div className="space-y-2">
                    <Label htmlFor="nurse-reg" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Registration Number</Label>
                    <Input id="nurse-reg" placeholder="Enter your registration number" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nurse-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Photo</Label>
                    <Input id="nurse-photo" type="file" disabled />
                </div>
            </div>
        );
      case 'hospital_owner':
        return (
          <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Feature Coming Soon</AlertTitle>
                <AlertDescription>
                    Document uploads are not yet implemented. Your application will be submitted for review without attachments.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="org-name" className="flex items-center gap-2"><Building className="h-4 w-4" /> Name of the Organization</Label>
              <Input id="org-name" placeholder="Enter organization name" value={orgDetails.name} onChange={e => setOrgDetails({...orgDetails, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-reg" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Registration Number</Label>
              <Input id="org-reg" placeholder="Enter organization registration number" value={orgDetails.reg} onChange={e => setOrgDetails({...orgDetails, reg: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-tin" className="flex items-center gap-2"><Hash className="h-4 w-4" /> TIN Number</Label>
              <Input id="org-tin" placeholder="Enter TIN number" value={orgDetails.tin} onChange={e => setOrgDetails({...orgDetails, tin: e.target.value})}/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="org-address" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
              <Textarea id="org-address" placeholder="Enter organization address" value={orgDetails.address} onChange={e => setOrgDetails({...orgDetails, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-cert" className="flex items-center gap-2"><File className="h-4 w-4" /> Photo of Registration Certificate</Label>
              <Input id="org-cert" type="file" disabled />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const verifiedRoles = user?.roles.filter(r => r !== 'patient') || [];

  return (
    <Card className="mt-6 bg-card">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Apply for an Additional Role
        </CardTitle>
        <CardDescription className="text-sm pt-1">
          Upgrade your account to a medical professional or hospital owner. Your application will be reviewed by an administrator.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleApply}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="role-select">Select a role to apply for</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isSubmitting}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {applicationRoles.map(roleValue => {
                    if (!user) return null;
                    const roleInfo = professionalRolesConfig[roleValue];
                    if (!roleInfo) return null;

                    const hasRole = user.roles.includes(roleValue as Role);
                    const pendingApp = applications?.find(app => app.requestedRole === roleValue && app.status === 'pending');
                    const isDisabled = hasRole || !!pendingApp;
                    let statusText = '';
                    if (hasRole) statusText = '(Current Role)';
                    else if (pendingApp) statusText = '(Pending Approval)';

                    return (
                        <SelectItem key={roleValue} value={roleValue} disabled={isDisabled}>
                          <div className="flex justify-between w-full items-center">
                            <span>{roleInfo.label}</span>
                            {statusText && <span className="text-muted-foreground text-xs ml-2">{statusText}</span>}
                          </div>
                        </SelectItem>
                    );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium capitalize">{selectedRole.replace(/_/g, ' ')} Application Details</h3>
              {renderRoleForm()}
            </div>
          )}

        </CardContent>
        {selectedRole && (
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !!applications?.find(app => app.requestedRole === selectedRole && app.status === 'pending')} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : `Submit Application for ${selectedRole.replace(/_/g, ' ')}`}
            </Button>
          </CardFooter>
        )}
      </form>

      <Separator className="my-4" />

        <CardContent className="space-y-6">
            <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    Your Application History
                </h3>
                {(applicationsLoading || removalRequestsLoading) ? (
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allRoleActivities.length === 0 ? (
                             <p className="text-sm text-muted-foreground text-center py-4">No application history.</p>
                        ) : (
                            allRoleActivities.map(activity => (
                                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg bg-background-soft">
                                    <div>
                                        <p className="font-medium capitalize">
                                            {activity.type === 'creation' ? 'Application for ' : 'Removal of '}
                                            <span className="font-bold">{activity.role.replace(/_/g, ' ')}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.type === 'creation' ? 'Applied: ' : 'Requested: '}
                                            <FormattedDate date={activity.createdAt} formatString="dd-MM-yyyy" fallback="N/A" />
                                        </p>
                                        {activity.status === 'rejected' && activity.reason && <p className="text-xs text-destructive/80 mt-1">Reason: {activity.reason}</p>}
                                        {activity.status === 'approved' && activity.reviewedAt && (
                                            <p className="text-xs text-green-600">
                                                Approved: <FormattedDate date={activity.reviewedAt} formatString="dd-MM-yyyy" />
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant={
                                        activity.status === 'pending' ? 'secondary' 
                                        : activity.status === 'approved' ? 'default'
                                        : 'destructive'
                                    } className={
                                        activity.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                        : activity.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200'
                                        : ''
                                    }>
                                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Your Verified Roles
                </h3>
                {userLoading || removalRequestsLoading ? (
                     <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                ) : (
                    <div className="space-y-2">
                        {verifiedRoles.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">You have no verified professional roles.</p>
                        ) : (
                            verifiedRoles.map(role => {
                                const approvalInfo = applications?.find(app => app.requestedRole === role && app.status === 'approved');
                                const removalPending = removalRequests?.find(req => req.roleToRemove === role && req.status === 'pending');
                                
                                return (
                                <div key={role} className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50 border-emerald-200">
                                    <div>
                                        <p className="font-medium capitalize">{role.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Verified: <FormattedDate date={approvalInfo?.reviewedAt} formatString="dd-MM-yyyy" fallback="N/A" /></p>
                                    </div>

                                    {removalPending ? (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                            Removal Pending
                                        </Badge>
                                    ) : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Request Role Removal?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will submit a request to an administrator to remove your access to the {role.replace(/_/g, ' ')} dashboard. You will be notified once it's reviewed.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRequestRoleRemoval(role as Role)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Request Removal</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            )})
                        )}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
