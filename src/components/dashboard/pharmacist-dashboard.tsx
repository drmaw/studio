
'use client'

import type { User } from "@/lib/definitions";
import { Pill } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";
import { MyUpcomingShifts } from "./my-upcoming-shifts";

export function PharmacistDashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            <PlaceholderDashboard user={user} roleInfo={{ title: 'Pharmacist', description: 'Manage pharmacy inventory and dispense medication.', icon: Pill }} />
            <MyUpcomingShifts />
        </div>
    );
}
