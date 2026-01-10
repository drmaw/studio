
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

  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!isUserLoading) {
      if (user && isPublicRoute && pathname !== '/') {
        router.replace('/dashboard');
      } else if (!user && isDashboardRoute) {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, isPublicRoute, isDashboardRoute, pathname, router]);

  if (isUserLoading && isDashboardRoute) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

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
