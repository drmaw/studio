'use client'

import type { User } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "lucide-react";

function PlaceholderDashboard({ user, roleInfo }: { user: User, roleInfo: { title: string, description: string, icon: React.ElementType } }) {
    const { title, description, icon: Icon } = roleInfo;
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

export function PharmacistDashboard({ user }: { user: User }) {
    return <PlaceholderDashboard user={user} roleInfo={{ title: 'Pharmacist', description: 'Manage pharmacy inventory and dispense medication.', icon: Pill }} />;
}
