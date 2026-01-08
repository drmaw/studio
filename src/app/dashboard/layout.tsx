
'use client'

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Stethoscope, X } from "lucide-react";
import { UserNav } from "@/components/dashboard/user-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function SidebarCloseButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <X />
        <span className="sr-only">Close sidebar</span>
    </Button>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
     return (
      <div className="flex h-screen w-full">
        <Skeleton className="hidden md:block w-64 h-full" />
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 w-full" />
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={cn(user?.isPremium && "premium-dashboard")}>
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2 p-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Digi Health</h1>
            </div>
             <SidebarCloseButton />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger />
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
