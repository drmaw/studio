'use client'

import type { User } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope, FlaskConical, Microscope, Pill, UserCog, UserCheck, Briefcase } from "lucide-react";

function PlaceholderDashboard({ user, roleInfo }: { user: User, roleInfo: { title: string, description: string, icon: React.ElementType } }) {
    const { title, description, icon: Icon } = roleInfo;
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Icon className="h-8 w-8" /> Welcome to the {title} Dashboard, {user.name}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Under Construction</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The dashboard for the {title.toLowerCase()} role is currently under construction. Please check back later for more features.</p>
                </CardContent>
            </Card>
        </div>
    )
}


export function NurseDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Nurse', description: 'Manage patient care, vitals, and notes.', icon: Stethoscope }} />;
}

export function LabTechnicianDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Lab Technician', description: 'Manage lab tests, samples, and results.', icon: FlaskConical }} />;
}

export function PathologistDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Pathologist', description: 'Analyze samples and prepare pathology reports.', icon: Microscope }} />;
}

export function PharmacistDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Pharmacist', description: 'Manage pharmacy inventory and dispense medication.', icon: Pill }} />;
}

export function ManagerDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Manager', description: 'Oversee hospital operations, staff, and reporting.', icon: UserCog }} />;
}

export function AssistantManagerDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Assistant Manager', description: 'Assist in overseeing hospital operations.', icon: UserCheck }} />;
}

export function FrontDeskDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Front Desk', description: 'Manage patient check-in, appointments, and inquiries.', icon: Briefcase }} />;
}
