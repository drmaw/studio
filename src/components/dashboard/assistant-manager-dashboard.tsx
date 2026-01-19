
'use client'

import type { User } from "@/lib/definitions";
import { UserCheck } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function AssistantManagerDashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Assistant Manager', description: 'Assist in overseeing hospital operations.', icon: UserCheck }} />
            <MyUpcomingShifts />
        </div>
    );
}
