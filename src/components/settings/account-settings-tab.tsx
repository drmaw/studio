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
import { Separator } from '../ui/separator';

export function AccountSettingsTab() {
  const { toast } = useToast();
  const [isVitalsVisible, setIsVitalsVisible] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const handleUpgrade = () => {
    // Mock premium upgrade
    setIsPremium(true);
    toast({
        title: "Congratulations!",
        description: "You've been upgraded to a Premium account."
    });
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
    </div>
  );
}
