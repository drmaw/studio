

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import type { Role, User } from '@/lib/definitions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { UserPlus, IdCard, File, Building, Hash, MapPin, Loader2 } from "lucide-react";


export function ApplyForRoleCard() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [orgDetails, setOrgDetails] = useState({ name: '', reg: '', tin: '', address: '' });

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

    setIsSubmitting(true);
    
    try {
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, "users", user.id);
        const patientRef = doc(firestore, "patients", user.id);

        if (user.roles.includes(selectedRole as Role)) {
            toast({
                title: "Already Applied",
                description: `You already have the ${selectedRole.replace(/_/g, ' ')} role.`,
            });
            setIsSubmitting(false);
            return;
        }

        const updatedRoles = Array.from(new Set([...user.roles, selectedRole as Role]));
        
        let updateData: Partial<User> = { roles: updatedRoles };
        const demoOrganizationId = 'org-1';
        
        if (selectedRole === 'hospital_owner') {
             const organizationId = `org-${Date.now()}`;
             updateData.organizationId = organizationId;
             batch.update(patientRef, { organizationId: organizationId });
        } 
        else if (selectedRole === 'doctor' || selectedRole === 'nurse') {
            updateData.organizationId = demoOrganizationId;
            batch.update(patientRef, { organizationId: demoOrganizationId });
        }
        
        batch.update(userRef, updateData);
        
        await batch.commit();

        toast({
            title: "Application Approved!",
            description: `You now have the ${selectedRole.replace(/_/g, ' ')} role. Please refresh to see changes.`,
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

  return (
    <Card className="mt-6 bg-card">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Apply for an Additional Role
        </CardTitle>
        <CardDescription className="text-sm pt-1">
          Upgrade your account to a medical professional or hospital owner.
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
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="hospital_owner">Hospital Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium capitalize">{selectedRole.replace(/_/g, ' ')} Application</h3>
              {renderRoleForm()}
            </div>
          )}

        </CardContent>
        {selectedRole && (
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : `Apply for ${selectedRole.replace(/_/g, ' ')} Role`}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
