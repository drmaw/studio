
'use client'

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, BarChart, Users, Briefcase, Building, ShieldAlert } from 'lucide-react';
import { AdminStats } from '@/components/dashboard/admin/admin-stats';
import { RoleManagementTab } from '@/components/dashboard/admin/role-management-tab';
import { UsersTable } from '@/components/dashboard/admin/users-table';
import { OrganizationsTable } from '@/components/dashboard/admin/organizations-table';
import { GlobalAuditLog } from '@/components/dashboard/admin/global-audit-log';
import { PageHeader } from '@/components/shared/page-header';


export default function AdminDashboardPage() {
    const { user, hasRole, loading } = useAuth();
    const router = useRouter();

    if (!loading && user && !hasRole('admin')) {
        router.replace('/dashboard');
        return null;
    }
    
    if (loading || !user) {
        return <Skeleton className="h-screen w-full" />
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title={<><UserCog className="h-8 w-8" /> Admin Dashboard</>}
                description="Monitor and manage the entire Digi Health platform."
            />
            
            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview"><BarChart className="mr-2 h-4 w-4"/>Overview</TabsTrigger>
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Users</TabsTrigger>
                    <TabsTrigger value="roles"><Briefcase className="mr-2 h-4 w-4"/>Role Mgmt</TabsTrigger>
                    <TabsTrigger value="organizations"><Building className="mr-2 h-4 w-4"/>Orgs</TabsTrigger>
                    <TabsTrigger value="audit"><ShieldAlert className="mr-2 h-4 w-4"/>Audit Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <AdminStats />
                </TabsContent>
                <TabsContent value="users">
                    <UsersTable />
                </TabsContent>
                <TabsContent value="roles">
                    <RoleManagementTab />
                </TabsContent>
                <TabsContent value="organizations">
                    <OrganizationsTable />
                </TabsContent>
                <TabsContent value="audit">
                    <GlobalAuditLog />
                </TabsContent>
            </Tabs>

        </div>
    )
}
