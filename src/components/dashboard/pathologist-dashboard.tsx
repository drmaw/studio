'use client'

import type { User } from "@/lib/definitions";
import { Microscope } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function PathologistDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Pathologist', description: 'Analyze samples and prepare pathology reports.', icon: Microscope }} />;
}
