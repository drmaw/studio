'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccountSettingsTab } from "@/components/settings/account-settings-tab";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && hasRole('hospital_owner')) {
            router.replace('/dashboard/settings/hospital');
        }
    }, [user, loading, hasRole, router]);

    if (loading || !user || hasRole('hospital_owner')) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    // Default to account settings for other roles like patient, doctor, etc.
    return <AccountSettingsTab />;
}
