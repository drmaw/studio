
'use client';

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider, useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(pathname);
  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    // Wait until the user's auth status is confirmed.
    if (!isUserLoading) {
      // If the user is logged in and tries to access login/register, redirect to dashboard.
      if (user && isAuthRoute) {
        router.replace('/dashboard');
      } 
      // If the user is not logged in and tries to access a protected dashboard route, redirect to login.
      else if (!user && isDashboardRoute) {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, isAuthRoute, isDashboardRoute, pathname, router]);

  // Show a full-page loader only for dashboard routes while auth state is loading.
  if (isUserLoading && isDashboardRoute) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // For public routes or once auth is resolved, show the content.
  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Digi Health</title>
        <meta name="description" content="Digital health record management & Hospital Information Systems" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AppContent>
            {children}
          </AppContent>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
