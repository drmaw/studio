
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

  useEffect(() => {
    // Wait until the user's auth status is fully resolved.
    if (isUserLoading) {
      return; // Do nothing while loading.
    }

    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isDashboardRoute = pathname.startsWith('/dashboard');

    // If we have a user and they are on an auth route, redirect to dashboard.
    if (user && isAuthRoute) {
      router.replace('/dashboard');
    }
    // If we have no user and they are on a protected dashboard route, redirect to login.
    else if (!user && isDashboardRoute) {
      router.replace('/login');
    }
    // No other redirection is needed. The user is either in the correct place,
    // or on a public route which is always allowed.

  }, [user, isUserLoading, pathname, router]);

  // Show a full-page loader only for dashboard routes while the initial auth check is running.
  if (isUserLoading && pathname.startsWith('/dashboard')) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  // If we are on an auth route, but the user is already logged in, we render null
  // because a redirect is in progress. This prevents a flash of the login/register page.
  if (user && (pathname === '/login' || pathname === '/register')) {
    return null;
  }
  
  // If we are on a dashboard route, but the user is not logged in, we render null
  // because a redirect to /login is in progress.
  if (!user && pathname.startsWith('/dashboard')) {
    return null;
  }

  // Render the actual content.
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
