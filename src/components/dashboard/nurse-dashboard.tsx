
'use client'

import type { User } from "@/lib/definitions";
import { Stethoscope } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function NurseDashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Nurse', description: 'Manage patient care, vitals, and notes.', icon: Stethoscope }} />
            <MyUpcomingShifts />
        </div>
    );
}
