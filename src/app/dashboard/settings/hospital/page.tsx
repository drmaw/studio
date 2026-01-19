'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffManagementTab } from "@/components/dashboard/settings/staff-management-tab";
import { DoctorSchedulesTab } from "@/components/dashboard/settings/doctor-schedules-tab";
import { FacilityManagementTab } from "@/components/dashboard/settings/facility-management-tab";
import { GeneralSettingsTab } from "@/components/dashboard/settings/general-settings-tab";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryManagementTab } from "@/components/dashboard/settings/inventory-management-tab";
import { useAuth } from "@/hooks/use-auth";

export default function HospitalSettingsPage() {
    const { hasRole } = useAuth();
    const isOwner = hasRole('hospital_owner');
    
    // Define descriptions for reuse
    const descriptions = {
        general: "View and manage your hospital's general information.",
        staff: "Hire new staff by searching their Health ID and assign them a role in your organization.",
        schedules: "Assign doctors to chambers, set their weekly schedule, and define consultation fees.",
        facilities: "Manage your hospital's wards, cabins, beds, and their costs.",
        inventory: "Manage your hospital's general supplies and track stock levels."
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Hospital Settings"
                description="Manage your organization's staff, services, and schedules."
            />
            <Tabs defaultValue={isOwner ? "general" : "staff"}>
                <TabsList className={`grid w-full ${isOwner ? 'grid-cols-5' : 'grid-cols-3'}`}>
                    {isOwner && <TabsTrigger value="general">General</TabsTrigger>}
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="schedules">Doctor Schedules</TabsTrigger>
                    {isOwner && <TabsTrigger value="facilities">Facility Management</TabsTrigger>}
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>
                
                {isOwner && (
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>{descriptions.general}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GeneralSettingsTab />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Management</CardTitle>
                            <CardDescription>{descriptions.staff}</CardDescription>
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
                            <CardDescription>{descriptions.schedules}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <DoctorSchedulesTab />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {isOwner && (
                    <TabsContent value="facilities">
                         <Card>
                            <CardHeader>
                                <CardTitle>Facility Management</CardTitle>
                                <CardDescription>{descriptions.facilities}</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <FacilityManagementTab />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Management</CardTitle>
                            <CardDescription>{descriptions.inventory}</CardDescription>
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
