import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffManagementTab } from "@/components/dashboard/settings/staff-management-tab";
import { DoctorSchedulesTab } from "@/components/dashboard/settings/doctor-schedules-tab";
import { FacilityManagementTab } from "@/components/dashboard/settings/facility-management-tab";
import { GeneralSettingsTab } from "@/components/dashboard/settings/general-settings-tab";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';


export default function HospitalSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Hospital Settings</h1>
                <p className="text-muted-foreground">Manage your organization's staff, services, and schedules.</p>
            </div>
            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="billing">Billing & Fees</TabsTrigger>
                    <TabsTrigger value="schedules">Doctor Schedules</TabsTrigger>
                    <TabsTrigger value="facilities">Facility Management</TabsTrigger>
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
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing & Fees</CardTitle>
                            <CardDescription>Manage the price chart for various services offered at your hospital.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center p-12">
                           <p className="text-muted-foreground mb-4">Billing management has been moved to its own dedicated page, accessible by both Hospital Owners and Managers.</p>
                           <Button asChild>
                               <Link href="/dashboard/billing">
                                    Go to Billing & Fees <ArrowRight className="ml-2 h-4 w-4" />
                               </Link>
                           </Button>
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
            </Tabs>
        </div>
    )
}
