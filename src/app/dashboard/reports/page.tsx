
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { FinancialReports } from '@/components/dashboard/reports/financial-reports';
import { BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title={<><BarChart className="h-8 w-8" /> Reports & Analytics</>}
                description="Analyze financial and operational performance of your organization."
            />

            <Tabs defaultValue="financial">
                <TabsList>
                    <TabsTrigger value="financial">Financial Reports</TabsTrigger>
                    <TabsTrigger value="operational" disabled>Operational Reports</TabsTrigger>
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
                    {/* Placeholder for future operational reports */}
                </TabsContent>
            </Tabs>
        </div>
    );
}
