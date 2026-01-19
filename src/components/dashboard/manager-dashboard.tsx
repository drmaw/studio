
'use client'

import type { User } from "@/lib/definitions";
import { UserCog } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function ManagerDashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Manager', description: 'Oversee hospital operations, staff, and reporting.', icon: UserCog }} />
            <MyUpcomingShifts />
        </div>
    );
}
