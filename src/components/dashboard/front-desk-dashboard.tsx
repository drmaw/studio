'use client'

import type { User } from "@/lib/definitions";
import { Briefcase } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function FrontDeskDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Front Desk', description: 'Manage patient check-in, appointments, and inquiries.', icon: Briefcase }} />;
}
