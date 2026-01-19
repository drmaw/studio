
'use client'

import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { HospitalOwnerDashboard } from "@/components/dashboard/hospital-owner-dashboard";
import { LabTechnicianDashboard } from "@/components/dashboard/lab-technician-dashboard";
import { MyUpcomingShifts } from "@/components/dashboard/my-upcoming-shifts";
import { PlaceholderDashboard } from "@/components/dashboard/placeholder-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { type Role } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";


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

  // A map of specific dashboard components that have unique layouts.
  const specificDashboards: Partial<Record<Role, React.ComponentType<{ user: typeof user }>>> = {
    'doctor': DoctorDashboard,
    'hospital_owner': HospitalOwnerDashboard,
    'lab_technician': LabTechnicianDashboard,
    'marketing_rep': RepDashboard,
  };
  
  const SpecificDashboard = specificDashboards[dashboardRole];

  if (SpecificDashboard) {
    return <SpecificDashboard user={user} />;
  }

  // These roles use the standard placeholder + shifts layout.
  const placeholderRolesWithShifts: Role[] = [
    'nurse', 
    'manager', 
    'assistant_manager', 
    'pathologist', 
    'pharmacist', 
    'front_desk'
  ];

  if (placeholderRolesWithShifts.includes(dashboardRole)) {
    return (
      <div className="space-y-6">
        <PlaceholderDashboard user={user} role={dashboardRole} />
        <MyUpcomingShifts />
      </div>
    );
  }

  // Fallback for any other professional role that might not be explicitly handled.
  return <PlaceholderDashboard user={user} role={dashboardRole} />;
}
