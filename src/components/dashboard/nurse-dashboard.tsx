'use client'

import type { User } from "@/lib/definitions";
import { Stethoscope } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function NurseDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Nurse', description: 'Manage patient care, vitals, and notes.', icon: Stethoscope }} />;
}
