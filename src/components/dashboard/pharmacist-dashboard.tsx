'use client'

import type { User } from "@/lib/definitions";
import { Pill } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function PharmacistDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Pharmacist', description: 'Manage pharmacy inventory and dispense medication.', icon: Pill }} />;
}
