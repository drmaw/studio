
'use client'

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppRootPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/');
        }
    }, [user, loading, router]);

    return (
      <div className="h-screen w-screen flex items-center justify-center">
          <Skeleton className="h-full w-full" />
      </div>
    );
}
