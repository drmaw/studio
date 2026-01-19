
'use client'

import type { User, Role } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { professionalRolesConfig } from "@/lib/roles";
import { PageHeader } from "../shared/page-header";

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
            <PageHeader 
                title={<><Icon className="h-8 w-8" /> Welcome to the {title} Dashboard, {user.name}</>}
                description={description}
            />
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
