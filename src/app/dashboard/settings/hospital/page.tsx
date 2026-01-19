import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffManagementTab } from "@/components/dashboard/settings/staff-management-tab";
import { DoctorSchedulesTab } from "@/components/dashboard/settings/doctor-schedules-tab";
import { FacilityManagementTab } from "@/components/dashboard/settings/facility-management-tab";
import { GeneralSettingsTab } from "@/components/dashboard/settings/general-settings-tab";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryManagementTab } from "@/components/dashboard/settings/inventory-management-tab";

export default function HospitalSettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Hospital Settings"
                description="Manage your organization's staff, services, and schedules."
            />
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="schedules">Doctor Schedules</TabsTrigger>
                    <TabsTrigger value="facilities">Facility Management</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>View and manage your hospital's general information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GeneralSettingsTab />
                        </CardContent>
                    </Card>
                </TabsContent>
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
                <TabsContent value="schedules">
                     <Card>
                        <CardHeader>
                            <CardTitle>Doctor Schedules</CardTitle>
                            <CardDescription>Assign doctors to chambers, set their weekly schedule, and define consultation fees.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <DoctorSchedulesTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="facilities">
                     <Card>
                        <CardHeader>
                            <CardTitle>Facility Management</CardTitle>
                            <CardDescription>Manage your hospital's wards, cabins, beds, and their costs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <FacilityManagementTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Management</CardTitle>
                            <CardDescription>Manage your hospital's general supplies and track stock levels.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <InventoryManagementTab />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
