
'use client';

import { useAuth } from "@/hooks/use-auth";
import { AccountSettingsTab } from "@/components/settings/account-settings-tab";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const { user, loading } = useAuth();

    if (loading || !user) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    // This page is now the same for everyone.
    return <AccountSettingsTab />;
}
