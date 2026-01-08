'use client'

import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { HospitalOwnerDashboard } from "@/components/dashboard/hospital-owner-dashboard";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
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

  switch (user.role) {
    case 'doctor':
      return <DoctorDashboard user={user} />;
    case 'patient':
      return <PatientDashboard user={user} />;
    case 'marketing_rep':
      return <RepDashboard user={user} />;
    case 'hospital_owner':
      return <HospitalOwnerDashboard user={user} />;
    default:
      // Render a dashboard for 'nurse' or a default view
      return <div>Welcome, {user.name}. Your dashboard is under construction.</div>;
  }
}
