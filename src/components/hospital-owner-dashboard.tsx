
import type { User } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Users, Activity, Settings } from "lucide-react";
import Link from "next/link";

export function HospitalOwnerDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <Button asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Hospital Settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-background-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Hospital Analytics
            </CardTitle>
            <CardDescription>
              View patient statistics, appointments, and operational data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Analytics dashboard coming soon.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background-softer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
             Patient Records
            </CardTitle>
            <CardDescription>
              Access and manage digital health records for your hospital.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground text-center">
              Patient record system coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
