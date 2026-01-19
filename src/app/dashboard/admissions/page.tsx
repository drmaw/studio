
'use client'

import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BedDouble, Loader2, Search, UserX, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Admission } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { usePatientSearch } from "@/hooks/use-patient-search";
import { PatientInfoCard } from "@/components/shared/patient-info-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormattedDate } from "@/components/shared/formatted-date";
import { AdmitPatientDialog } from "@/components/dashboard/admissions/admit-patient-dialog";

export default function AdmissionsPage() {
    const { user: currentUser } = useAuth();

    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResult,
        handleSearch,
    } = usePatientSearch();
    
    const firestore = useFirestore();

    const admissionsQuery = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return query(
            collection(firestore, 'organizations', currentUser.organizationId, 'admissions'),
            where('status', '==', 'admitted'),
            orderBy('admissionDate', 'desc')
        );
    }, [currentUser, firestore]);

    const { data: admissions, isLoading: admissionsLoading } = useCollection<Admission>(admissionsQuery);
    
    const searchedPatient = searchResult !== 'not_found' ? searchResult : null;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Admissions (ADT)"
                description="Manage patient admissions, discharges, and transfers for your organization."
            />
             <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Admit New Patient</CardTitle>
                    <CardDescription>Find a patient by their Health ID or mobile number to admit them.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Enter Health ID or Mobile Number..." 
                                className="pl-8" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={() => handleSearch()} disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isSearching && (
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            )}
            
            {searchResult === 'not_found' && (
                 <EmptyState
                    icon={UserX}
                    message="No Patient Found"
                    description="No patient record matches the provided ID or mobile number."
                 />
            )}

            {searchedPatient && currentUser && (
                <PatientInfoCard 
                    patient={searchedPatient}
                    actionSlot={
                        <AdmitPatientDialog patient={searchedPatient} organizationId={currentUser.organizationId} />
                    }
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Current In-Patients</CardTitle>
                    <CardDescription>A list of all patients currently admitted in your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Admission Date</TableHead>
                                <TableHead>Facility</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admissionsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : admissions && admissions.length > 0 ? (
                                admissions.map(admission => (
                                    <TableRow key={admission.id}>
                                        <TableCell className="font-medium">{admission.patientName}</TableCell>
                                        <TableCell><FormattedDate date={admission.admissionDate} formatString="dd-MM-yyyy, hh:mm a" /></TableCell>
                                        <TableCell>{admission.facilityName}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">
                                                Discharge
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No patients are currently admitted.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
