
'use client'

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth as useAppAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { Button } from "@/components/ui/button";
import { LogOut, Stethoscope } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAppAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    // This is a safeguard. If, for any reason, the auth state is lost while on a dashboard page,
    // this will redirect the user back to the login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  // While the combined user profile (auth + firestore) is loading, show a skeleton UI.
  if (loading || !user) {
     return (
      <div className="flex h-screen w-full">
        <div className="hidden md:flex flex-col w-64 border-r">
             <div className="flex items-center gap-2 font-semibold text-lg h-14 px-4 border-b">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex-1 p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
             <div className="p-4 mt-auto border-t">
                 <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <Skeleton className="h-8 w-8 rounded-full" />
          </header>
          <div className="flex-1 p-4 sm:p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full flex")}>
        <Sidebar>
            <SidebarHeader>
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-sidebar-primary-foreground">
                    <Stethoscope className="h-6 w-6" />
                    <span>Digi Health</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter>
                <Button variant="destructive" className="justify-start w-full" onClick={handleLogout}>
                    <LogOut />
                    <span>Logout</span>
                </Button>
            </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <SidebarTrigger />
                <UserNav />
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
