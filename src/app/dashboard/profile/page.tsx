'use client'

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    localStorage.removeItem("digi-health-user-id");
    router.push('/');
  };

  if (loading || !user) {
    return <div className="flex justify-center">
        <Skeleton className="h-80 w-full max-w-lg" />
    </div>;
  }
  
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="flex justify-center">
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl">{user.name}</CardTitle>
                <CardDescription className="text-base pt-1">
                    <Badge variant="secondary" className="capitalize">
                        {user.role.replace('_', ' ')}
                    </Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center border-t pt-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span>User ID: {user.id}</span>
                    </div>
                </div>
                <Button onClick={handleLogout} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
