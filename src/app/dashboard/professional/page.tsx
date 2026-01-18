'use client'

import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HospitalOwnerDashboard } from "@/components/dashboard/hospital-owner-dashboard";
import { NurseDashboard } from "@/components/dashboard/nurse-dashboard";
import { LabTechnicianDashboard } from "@/components/dashboard/lab-technician-dashboard";
import { PathologistDashboard } from "@/components/dashboard/pathologist-dashboard";
import { PharmacistDashboard } from "@/components/dashboard/pharmacist-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { AssistantManagerDashboard } from "@/components/dashboard/assistant-manager-dashboard";
import { FrontDeskDashboard } from "@/components/dashboard/front-desk-dashboard";

function GenericDashboard({ name }: { name: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, {name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Your professional dashboard is under construction.</p>
            </CardContent>
        </Card>
    )
}

export default function ProfessionalDashboardPage() {
  const { user, loading, activeRole, hasRole } = useAuth();
  
  if (loading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }
  
  // The root layout and sidebar navigation should prevent users with only the 'patient'
  // role from reaching this page. If they do, render nothing until navigation corrects.
  if (user.roles?.length === 1 && hasRole('patient')) {
    return null;
  }

  switch (activeRole) {
    case 'doctor':
      return <DoctorDashboard user={user} />;
    case 'marketing_rep':
      return <RepDashboard user={user} />;
    case 'hospital_owner':
      return <HospitalOwnerDashboard user={user} />;
    case 'nurse':
      return <NurseDashboard user={user} />;
    case 'lab_technician':
        return <LabTechnicianDashboard user={user} />;
    case 'pathologist':
        return <PathologistDashboard user={user} />;
    case 'pharmacist':
        return <PharmacistDashboard user={user} />;
    case 'manager':
        return <ManagerDashboard user={user} />;
    case 'assistant_manager':
        return <AssistantManagerDashboard user={user} />;
    case 'front_desk':
        return <FrontDeskDashboard user={user} />;
    // The 'patient' case is handled by the guard clause above.
    // It's safe to have a default for other professional roles.
    default:
      return <GenericDashboard name={user.name} />;
  }
}
