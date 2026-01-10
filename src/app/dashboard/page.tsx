
'use client'

import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  // "My Dashboard" always shows the patient view for all users.
  return <PatientDashboard user={user} />;
}
