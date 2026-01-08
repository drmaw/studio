'use client'

import { DoctorDashboard } from "@/components/doctor-dashboard";
import { HospitalOwnerDashboard } from "@/components/hospital-owner-dashboard";
import { PatientDashboard } from "@/components/patient-dashboard";
import { RepDashboard } from "@/components/rep-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function GenericDashboard({ name }: { name: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, {name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Your dashboard is under construction.</p>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { user, loading, activeRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  switch (activeRole) {
    case 'doctor':
      return <DoctorDashboard user={user} />;
    case 'patient':
      return <PatientDashboard user={user} />;
    case 'marketing_rep':
      return <RepDashboard user={user} />;
    case 'hospital_owner':
      return <HospitalOwnerDashboard user={user} />;
    default:
      // Render a generic dashboard for other roles
      return <GenericDashboard name={user.name} />;
  }
}
