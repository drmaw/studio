
'use client'

import type { User } from "@/lib/definitions";
import { Briefcase } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function FrontDeskDashboard({ user }: { user: User }) {
    return (
         <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Front Desk', description: 'Manage patient check-in, appointments, and inquiries.', icon: Briefcase }} />
            <MyUpcomingShifts />
        </div>
    );
}
