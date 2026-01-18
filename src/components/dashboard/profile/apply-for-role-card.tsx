

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Role, RoleApplication } from '@/lib/definitions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, IdCard, File, Building, Hash, MapPin, Loader2 } from "lucide-react";


const availableRoles = [
    { value: 'doctor', label: 'Doctor'},
    { value: 'nurse', label: 'Nurse' },
    { value: 'hospital_owner', label: 'Hospital Owner' },
];

export function ApplyForRoleCard() {
  const { user } = useAuth();
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
    // For now, we'll just submit the form data.

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

  if (!user) return null;

  const isApplyDisabled = isSubmitting || !selectedRole || user.roles.includes(selectedRole as Role) || !!applications?.find(app => app.requestedRole === selectedRole && app.status === 'pending');
  
  let buttonText = `Apply for ${selectedRole ? selectedRole.replace(/_/g, ' ') : ''} Role`;
  if (selectedRole && user.roles.includes(selectedRole as Role)) {
      buttonText = "You already have this role";
  } else if (selectedRole && applications?.find(app => app.requestedRole === selectedRole && app.status === 'pending')) {
      buttonText = "Application is Pending";
  } else if (!selectedRole) {
      buttonText = "Select a Role to Apply";
  }

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
            <Button type="submit" disabled={isApplyDisabled} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : buttonText}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
