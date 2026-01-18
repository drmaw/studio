'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { Role, RoleApplication, RoleRemovalRequest } from '@/lib/definitions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, IdCard, File, Building, Hash, MapPin, Loader2, Clock, CheckCircle, Trash2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const availableRoles = [
    { value: 'doctor', label: 'Doctor'},
    { value: 'nurse', label: 'Nurse' },
    { value: 'hospital_owner', label: 'Hospital Owner' },
];

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


  const handleApply = async (event: React.FormEvent) => {
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
    // In a real app, you would handle file uploads for BMDC certs, etc.

    try {
        const applicationsRef = collection(firestore, 'users', user.id, 'role_applications');
        
        const newApplication: Omit<RoleApplication, 'id'> = {
            userId: user.id,
            userName: user.name,
            requestedRole: selectedRole as Role,
            status: 'pending',
            details: applicationDetails,
            createdAt: serverTimestamp(),
        };

        await addDoc(applicationsRef, newApplication);

        toast({
            title: "Application Submitted",
            description: `Your application for the ${selectedRole.replace(/_/g, ' ')} role is now pending review.`,
        });

    } catch (error) {
        console.error("Application submission failed:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your application." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRequestRoleRemoval = async (roleToDelete: Role) => {
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

    try {
        const removalRequestsRef = collection(firestore, 'users', user.id, 'role_removal_requests');
        const newRemovalRequest = {
            userId: user.id,
            userName: user.name,
            roleToRemove: roleToDelete,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };
        await addDoc(removalRequestsRef, newRemovalRequest);
        toast({
            title: "Removal Request Submitted",
            description: `Your request to remove the ${roleToDelete.replace(/_/g, ' ')} role is now pending admin review.`,
        });
    } catch (error) {
        console.error("Failed to submit removal request:", error);
        toast({
            variant: "destructive",
            title: "Request Failed",
            description: "Could not submit your role removal request.",
        });
    }
  };
  
  const renderRoleForm = () => {
    switch(selectedRole) {
      case 'doctor':
        return (
          <div className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="bmdc" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> BMDC Registration Number</Label>
              <Input id="bmdc" placeholder="Enter your BMDC number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Picture</Label>
              <Input id="doctor-photo" type="file" />
            </div>
          </div>
        );
      case 'nurse':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nurse-reg" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Registration Number</Label>
              <Input id="nurse-reg" placeholder="Enter your registration number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nurse-photo" className="flex items-center gap-2"><File className="h-4 w-4" /> Your Photo</Label>
              <Input id="nurse-photo" type="file" />
            </div>
          </div>
        );
      case 'hospital_owner':
        return (
          <div className="space-y-4">
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
              <Input id="org-cert" type="file" />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const pendingApplications = applications?.filter(app => app.status === 'pending');
  const rejectedApplications = applications?.filter(app => app.status === 'rejected');
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
                {availableRoles.map(roleInfo => {
                    if (!user) return null;
                    const hasRole = user.roles.includes(roleInfo.value as Role);
                    const pendingApp = applications?.find(app => app.requestedRole === roleInfo.value && app.status === 'pending');
                    const isDisabled = hasRole || !!pendingApp;
                    let statusText = '';
                    if (hasRole) statusText = '(Current Role)';
                    else if (pendingApp) statusText = '(Pending Approval)';

                    return (
                        <SelectItem key={roleInfo.value} value={roleInfo.value} disabled={isDisabled}>
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
                    Your Role Applications
                </h3>
                {applicationsLoading ? (
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(!pendingApplications || pendingApplications.length === 0) && (!rejectedApplications || rejectedApplications.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No pending or denied applications.</p>
                        ) : (
                            <>
                                {pendingApplications?.map(app => (
                                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg bg-background-soft">
                                        <div>
                                            <p className="font-medium capitalize">{app.requestedRole.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-muted-foreground">Applied: {app.createdAt ? format((app.createdAt as any).toDate(), 'dd-MM-yyyy') : 'N/A'}</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                                    </div>
                                ))}
                                {rejectedApplications?.map(app => (
                                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg bg-background-soft">
                                        <div>
                                            <p className="font-medium capitalize">{app.requestedRole.replace(/_/g, ' ')}</p>
                                             <p className="text-xs text-muted-foreground">Applied: {app.createdAt ? format((app.createdAt as any).toDate(), 'dd-MM-yyyy') : 'N/A'}</p>
                                             {app.reason && <p className="text-xs text-destructive/80 mt-1">Reason: {app.reason}</p>}
                                        </div>
                                        <Badge variant="destructive">Denied</Badge>
                                    </div>
                                ))}
                            </>
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
                                        <p className="text-xs text-muted-foreground">Verified: {approvalInfo?.reviewedAt ? format((approvalInfo.reviewedAt as any).toDate(), 'dd-MM-yyyy') : 'N/A'}</p>
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
