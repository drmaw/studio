
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { FinancialReports } from '@/components/dashboard/reports/financial-reports';
import { BarChart, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OperationalReports } from '@/components/dashboard/reports/operational-reports';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title={<><BarChart className="h-8 w-8" /> Reports & Analytics</>}
                description="Analyze financial and operational performance of your organization."
            />

            <Tabs defaultValue="financial">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="financial">Financial Reports</TabsTrigger>
                    <TabsTrigger value="operational">Operational Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="financial">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Overview</CardTitle>
                            <CardDescription>Key metrics like revenue, outstanding balances, and historical trends.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FinancialReports />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="operational">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Operational Overview</CardTitle>
                            <CardDescription>Key metrics for hospital efficiency like bed occupancy and patient stay duration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OperationalReports />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
