'use client'

import type { User } from "@/lib/definitions";
import { UserCog } from "lucide-react";
import { PlaceholderDashboard } from "./placeholder-dashboard";

export function ManagerDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Manager', description: 'Oversee hospital operations, staff, and reporting.', icon: UserCog }} />;
}
