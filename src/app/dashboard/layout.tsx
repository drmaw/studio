
'use client'

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
     return (
      <div className="flex h-screen w-full">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
      <div className={cn("min-h-screen w-full", user?.isPremium && "premium-dashboard")}>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
  );
}
