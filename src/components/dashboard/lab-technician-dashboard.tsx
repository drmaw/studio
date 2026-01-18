'use client'

import type { User } from "@/lib/definitions";
import { FlaskConical } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function LabTechnicianDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Lab Technician', description: 'Manage lab tests, samples, and results.', icon: FlaskConical }} />;
}
