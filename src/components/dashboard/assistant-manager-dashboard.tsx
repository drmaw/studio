'use client'

import type { User } from "@/lib/definitions";
import { UserCheck } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function AssistantManagerDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Assistant Manager', description: 'Assist in overseeing hospital operations.', icon: UserCheck }} />;
}
