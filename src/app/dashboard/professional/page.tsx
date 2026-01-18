
'use client'

import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { HospitalOwnerDashboard } from "@/components/dashboard/hospital-owner-dashboard";
import { PlaceholderDashboard } from "@/components/dashboard/placeholder-dashboard";
import { useSearchParams } from "next/navigation";
import { type Role } from "@/lib/definitions";


export default function ProfessionalDashboardPage() {
  const { user, loading, hasRole, activeRole } = useAuth();
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get('role') as Role | null;


  if (loading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }
  
  // Use role from query param if valid, otherwise fallback to activeRole.
  const dashboardRole = roleFromQuery && user.roles.includes(roleFromQuery) ? roleFromQuery : activeRole;

  // The root layout and sidebar navigation should prevent users with only the 'patient'
  // role from reaching this page. If they do, render nothing until navigation corrects.
  if (user.roles?.length === 1 && hasRole('patient')) {
    return null;
  }

  // A map of specific dashboard components.
  const specificDashboards: Partial<Record<Role, React.ComponentType<{ user: typeof user }>>> = {
    'doctor': DoctorDashboard,
    'marketing_rep': RepDashboard,
    'hospital_owner': HospitalOwnerDashboard,
  };
  
  const SpecificDashboard = specificDashboards[dashboardRole];

  if (SpecificDashboard) {
    return <SpecificDashboard user={user} />;
  }

  // For all other professional roles, use the placeholder.
  return <PlaceholderDashboard user={user} role={dashboardRole} />;
}
