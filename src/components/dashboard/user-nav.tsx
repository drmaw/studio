
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth as useAppAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseAuth, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { LogOut, Settings, User as UserIcon, Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { Badge } from "../ui/badge";
import { collection, doc, orderBy, query, writeBatch } from "firebase/firestore";
import type { Notification } from "@/lib/definitions";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FormattedDate } from "../shared/formatted-date";

function NotificationBell() {
  const { user } = useAppAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.id, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkAllAsRead = async () => {
    if (!firestore || !user || unreadCount === 0) return;
    
    const batch = writeBatch(firestore);
    notifications?.forEach(n => {
      if (!n.isRead) {
        const notifRef = doc(firestore, 'users', user.id, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
      }
    });

    await batch.commit();
    toast({ title: 'Notifications marked as read.' });
  }

  return (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" forceMount>
           <DropdownMenuLabel className="font-normal">
              <div className="flex justify-between items-center">
                  <p className="text-sm font-medium leading-none">Notifications</p>
                  {unreadCount > 0 && (
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                      <CheckCheck className="mr-1 h-3 w-3" />
                      Mark all as read
                    </Button>
                  )}
              </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-80">
              {notifications && notifications.length > 0 ? (
                notifications.map(n => (
                  <DropdownMenuItem key={n.id} asChild className="data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto">
                    <Link href={n.href || '#'} className={`flex flex-col items-start gap-1 p-2 ${!n.isRead ? 'bg-accent' : ''}`}>
                       <p className="font-semibold">{n.title}</p>
                       <p className="text-xs text-muted-foreground">{n.description}</p>
                       <p className="text-xs text-muted-foreground/80 self-end">
                         <FormattedDate date={n.createdAt} formatString="dd-MM-yyyy, hh:mm a" fallback="" />
                       </p>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground p-4">No notifications yet.</p>
              )}
          </ScrollArea>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserNav() {
  const { user, loading } = useAppAuth();
  const auth = useFirebaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('') : '';

  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl} alt={user.name || ''} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
