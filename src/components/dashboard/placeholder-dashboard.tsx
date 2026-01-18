
'use client'

import type { User, Role } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { professionalRolesConfig } from "@/lib/roles";

export function PlaceholderDashboard({ user, role }: { user: User, role: Role }) {
    const roleInfo = professionalRolesConfig[role];

    if (!roleInfo) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Welcome, {user.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Dashboard for role '{role}' is not configured.</p>
                </CardContent>
            </Card>
        );
    }
    const { label: title, description, icon: Icon } = roleInfo;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Icon className="h-8 w-8" /> Welcome to the {title} Dashboard, {user.name}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Under Construction</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The dashboard for the {title.toLowerCase()} role is currently under construction. Please check back later for more features.</p>
                </CardContent>
            </Card>
        </div>
    )
}
