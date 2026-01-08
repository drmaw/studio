import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffManagementTab } from "@/components/dashboard/settings/staff-management-tab";
import { BillingFeesTab } from "@/components/dashboard/settings/billing-fees-tab";

export default function HospitalSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Hospital Settings</h1>
                <p className="text-muted-foreground">Manage your organization's staff, services, and schedules.</p>
            </div>
            <Tabs defaultValue="staff">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="billing">Billing & Fees</TabsTrigger>
                    <TabsTrigger value="schedules" disabled>Doctor Schedules</TabsTrigger>
                </TabsList>
                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Management</CardTitle>
                            <CardDescription>Hire new staff by searching their Health ID and assign them a role in your organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StaffManagementTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing & Fees</CardTitle>
                            <CardDescription>Manage the price chart for various services offered at your hospital.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <BillingFeesTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="schedules">
                    {/* Scheduling content will go here */}
                </TabsContent>
            </Tabs>
        </div>
    )
}
