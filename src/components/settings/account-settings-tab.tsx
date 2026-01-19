
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Sparkles, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useAuth as useFirebaseAuth, updateDocument } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../shared/page-header';
import { ConfirmationDialog } from '../shared/confirmation-dialog';
import { UpgradeToPremiumButton } from '../shared/upgrade-to-premium-button';

export function AccountSettingsTab() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const router = useRouter();

  const [isVitalsVisible, setIsVitalsVisible] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  
  useEffect(() => {
    if (user?.demographics?.privacySettings) {
        setIsVitalsVisible(user.demographics.privacySettings.vitalsVisible);
        setIsDiscoverable(user.demographics.privacySettings.discoverable);
    }
  }, [user]);

  const handlePrivacyChange = (key: 'vitalsVisible' | 'discoverable', value: boolean) => {
    if (!user || !firestore) return;
    
    const newSettings = {
        ...user.demographics?.privacySettings,
        [key]: value
    };

    if (key === 'vitalsVisible') setIsVitalsVisible(value);
    if (key === 'discoverable') setIsDiscoverable(value);

    
    const userRef = doc(firestore, 'users', user.id);
    updateDocument(userRef, {
        'demographics.privacySettings': newSettings
    }, () => {
        toast({ title: 'Privacy setting updated.' });
    });
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
        router.push('/'); // Force redirect to home page after logout.
    });
  };
  
  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  return (
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
                <CardDescription>Control who can see your information.</CardDescription>
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
                        trigger={<Button variant="destructive">Delete Account</Button>}
                        title="Are you absolutely sure?"
                        description="This action cannot be undone. This will schedule your account for permanent deletion in 30 days. You will be logged out immediately."
                        onConfirm={handleAccountDeletion}
                        confirmText="Delete"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
