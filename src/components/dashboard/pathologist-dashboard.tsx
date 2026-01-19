
'use client'

import type { User } from "@/lib/definitions";
import { Microscope } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function PathologistDashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Pathologist', description: 'Analyze samples and prepare pathology reports.', icon: Microscope }} />
            <MyUpcomingShifts />
        </div>
    );
}
