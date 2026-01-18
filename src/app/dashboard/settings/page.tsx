
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/use-auth";
import { AccountSettingsTab } from "@/components/settings/account-settings-tab";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && hasRole('hospital_owner')) {
            router.replace('/dashboard/settings/hospital');
        }
    }, [user, loading, hasRole, router]);

    if (loading || !user || hasRole('hospital_owner')) {
        // Show skeleton loader while loading or during redirection for hospital owners
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    // For non-hospital owners, show the standard account settings.
    return <AccountSettingsTab />;
}
