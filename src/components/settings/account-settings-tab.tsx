
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Sparkles, Loader2, Share2, Building } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useAuth as useFirebaseAuth, updateDocument } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../shared/page-header';
import { ConfirmationDialog } from '../shared/confirmation-dialog';
import { UpgradeToPremiumButton } from '../shared/upgrade-to-premium-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';


export function AccountSettingsTab() {
  const { toast } = useToast();
  const { user, loading, memberships } = useAuth();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const router = useRouter();

  // State for privacy settings
  const [isVitalsVisible, setIsVitalsVisible] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  // State for account deletion
  const [isDeleting, setIsDeleting] = useState(false);
  // State for consent confirmation dialog
  const [consentDialogState, setConsentDialogState] = useState<{isOpen: boolean; orgId: string; orgName: string} | null>(null);

  
  useEffect(() => {
    if (user?.demographics?.privacySettings) {
        setIsVitalsVisible(user.demographics.privacySettings.vitalsVisible);
        setIsDiscoverable(user.demographics.privacySettings.discoverable);
    }
  }, [user]);

  const handlePrivacyChange = (key: 'vitalsVisible' | 'discoverable', value: boolean) => {
    if (!user || !firestore) return;
    
    if (key === 'vitalsVisible') setIsVitalsVisible(value);
    if (key === 'discoverable') setIsDiscoverable(value);

    const newSettings = {
        ...(user.demographics?.privacySettings),
        [key]: value
    };
    
    const userRef = doc(firestore, 'users', user.id);
    updateDocument(userRef, {
        'demographics.privacySettings': newSettings
    }, () => {
        toast({ title: 'Privacy setting updated.' });
    }, () => {
        if (key === 'vitalsVisible') setIsVitalsVisible(!value);
        if (key === 'discoverable') setIsDiscoverable(!value);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Your privacy settings could not be saved.',
        });
    });
  };
  
  const handleConsentChange = (orgId: string, value: boolean) => {
    if (!user || !firestore) return;
    const memberRef = doc(firestore, 'organizations', orgId, 'members', user.id);
    updateDocument(memberRef, { 'consent.shareRecords': value }, () => {
        toast({ title: 'Consent setting updated.' });
    }, () => {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Your consent setting could not be saved.',
        });
    });
  };

  const handleConsentSwitchToggle = (checked: boolean, orgId: string, orgName: string) => {
      if (checked) {
          // If user is trying to enable consent, show the confirmation dialog
          setConsentDialogState({ isOpen: true, orgId, orgName });
      } else {
          // If user is disabling consent, do it directly
          handleConsentChange(orgId, false);
      }
  };

  const handleConfirmConsent = () => {
      if (consentDialogState) {
          handleConsentChange(consentDialogState.orgId, true);
          setConsentDialogState(null);
      }
  };

  const handleAccountDeletion = async () => {
    if (!user || !firestore || !auth) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not perform deletion. User session is invalid.",
        });
        return;
    };

    setIsDeleting(true);
    const userRef = doc(firestore, "users", user.id);
    updateDocument(userRef, {
        status: 'suspended',
        deletionScheduledAt: serverTimestamp()
    }, async () => {
        toast({
            title: "Account Deletion Scheduled",
            description: "Your account will be permanently deleted in 30 days. You have been logged out.",
        });

        await signOut(auth);
        router.push('/');
    }, () => {
        setIsDeleting(false);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Your account could not be scheduled for deletion.",
        });
    });
  };
  
  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  const consentableMemberships = memberships.filter(m => !m.orgId.startsWith('org-ind-'));

  return (
    <>
        <div className="space-y-6">
            <PageHeader
                title="Account Settings"
                description="Manage your account preferences, privacy, and subscription."
            />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Privacy Settings
                    </CardTitle>
                    <CardDescription>Control who can see your personal profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <div className='space-y-0.5'>
                            <Label htmlFor="vitals-visibility" className="text-base">Vitals Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                            Allow doctors to see your self-logged vitals history.
                            </p>
                        </div>
                        <Switch
                            id="vitals-visibility"
                            checked={isVitalsVisible}
                            onCheckedChange={(checked) => handlePrivacyChange('vitalsVisible', checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                        <div className='space-y-0.5'>
                            <Label htmlFor="discoverable" className="text-base">Profile Discoverability</Label>
                            <p className="text-sm text-muted-foreground">
                            Allow medical staff to find you via Health ID or mobile search.
                            </p>
                        </div>
                        <Switch
                            id="discoverable"
                            checked={isDiscoverable}
                            onCheckedChange={(checked) => handlePrivacyChange('discoverable', checked)}
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Data Sharing Consent
                    </CardTitle>
                    <CardDescription>Give hospitals permission to access your clinical records created by other organizations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {consentableMemberships.length > 0 ? (
                        consentableMemberships.map(member => (
                            <div key={member.orgId} className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                                <div className='space-y-0.5'>
                                    <Label htmlFor={`consent-${member.orgId}`} className="text-base flex items-center gap-2">
                                        <Building className="h-4 w-4" /> {member.orgName}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                    Allow staff at this hospital to view your complete medical history.
                                    </p>
                                </div>
                                <Switch
                                    id={`consent-${member.orgId}`}
                                    checked={member.consent?.shareRecords || false}
                                    onCheckedChange={(checked) => handleConsentSwitchToggle(checked, member.orgId, member.orgName)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">You are not a member of any hospitals. Your consent settings will appear here once you are.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Subscription
                    </CardTitle>
                    <CardDescription>Manage your Digi Health subscription plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user?.isPremium ? (
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                            <h3 className="font-semibold">You are a Premium Member!</h3>
                            <p className="text-sm">Enjoy increased storage and exclusive features.</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h3 className="font-semibold">Upgrade to Premium</h3>
                                <p className="text-sm text-muted-foreground">Get more storage and exclusive features.</p>
                            </div>
                            <UpgradeToPremiumButton asChild>
                                <Button>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Upgrade Now
                                </Button>
                            </UpgradeToPremiumButton>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card className="border-destructive/50">
                <CardHeader>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div>
                            <h3 className="font-semibold text-destructive">Delete Account</h3>
                            <p className="text-sm text-destructive/80">Permanently delete your account and all associated data.</p>
                        </div>
                        <ConfirmationDialog 
                            trigger={<Button variant="destructive" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Account'}
                            </Button>}
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will schedule your account for permanent deletion in 30 days. You will be logged out immediately."
                            onConfirm={handleAccountDeletion}
                            confirmText="Delete"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        <AlertDialog open={consentDialogState?.isOpen} onOpenChange={(open) => !open && setConsentDialogState(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Data Sharing</AlertDialogTitle>
                    <AlertDialogDescription>
                        By enabling this, you allow all verified medical professionals at <span className="font-bold">{consentDialogState?.orgName}</span> to view your complete medical history from all other hospitals you have visited on Digi Health. This consent can be revoked at any time from this page.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConsentDialogState(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmConsent}>
                        Confirm Consent
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
