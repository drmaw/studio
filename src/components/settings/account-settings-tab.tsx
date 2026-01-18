
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, EyeOff, Sparkles, Trash2, Bell } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function AccountSettingsTab() {
  const { toast } = useToast();
  const [isVitalsVisible, setIsVitalsVisible] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const { user } = useAuth();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const router = useRouter();


  const handleUpgrade = () => {
    // Mock premium upgrade
    setIsPremium(true);
    toast({
        title: "Congratulations!",
        description: "You've been upgraded to a Premium account."
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

    try {
        const userRef = doc(firestore, "users", user.id);
        await updateDoc(userRef, {
            deletionScheduledAt: serverTimestamp()
        });
        
        toast({
            title: "Account Deletion Scheduled",
            description: "Your account will be permanently deleted in 30 days. You have been logged out.",
        });

        await signOut(auth);
        router.push('/'); // Force redirect to home page after logout.

    } catch (error) {
        console.error("Failed to schedule account deletion:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while scheduling your account for deletion.",
        });
    }
  };

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences, privacy, and subscription.</p>
        </div>
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
                        onCheckedChange={setIsVitalsVisible}
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
                        onCheckedChange={setIsDiscoverable}
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
                {isPremium ? (
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
                        <Button onClick={handleUpgrade}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Upgrade Now
                        </Button>
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will schedule your account for permanent deletion in 30 days. You will be logged out immediately.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAccountDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
