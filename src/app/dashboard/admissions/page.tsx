
'use client'

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BedDouble, Loader2, Search, UserX, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase, commitBatch, writeBatch } from "@/firebase";
import { collection, query, where, orderBy, doc, serverTimestamp, getDocs, limit } from "firebase/firestore";
import type { Admission, Invoice } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { usePatientSearch } from "@/hooks/use-patient-search";
import { PatientInfoCard } from "@/components/shared/patient-info-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FormattedDate } from "@/components/shared/formatted-date";
import { AdmitPatientDialog } from "@/components/dashboard/admissions/admit-patient-dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdmissionsPage() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [dischargingId, setDischargingId] = useState<string | null>(null);

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

    const handleDischarge = async (admission: Admission) => {
        if (!currentUser || !firestore || !admission.facilityCostPerDay) {
            toast({ variant: 'destructive', title: 'Error', description: 'Required information for discharge is missing.' });
            return;
        };

        setDischargingId(admission.id);

        try {
            const batch = writeBatch(firestore);

            // 1. Update admission status
            const admissionRef = doc(firestore, 'organizations', currentUser.organizationId, 'admissions', admission.id);
            batch.update(admissionRef, {
                status: 'discharged' as const,
                dischargeDate: serverTimestamp(),
            });

            // 2. Calculate duration and add billing for additional days if necessary
            const admissionDate = (admission.admissionDate as any).toDate();
            const dischargeDate = new Date();
            const diffTime = dischargeDate.getTime() - admissionDate.getTime();
            const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const additionalDays = totalDays - 1;

            if (additionalDays > 0) {
                const invoicesRef = collection(firestore, 'organizations', currentUser.organizationId, 'invoices');
                const invoiceQuery = query(
                    invoicesRef,
                    where('patientId', '==', admission.patientId),
                    where('status', 'in', ['draft', 'open']),
                    limit(1)
                );
                const invoiceSnapshot = await getDocs(invoiceQuery);

                if (!invoiceSnapshot.empty) {
                    const invoiceDoc = invoiceSnapshot.docs[0];
                    const invoiceRef = invoiceDoc.ref;
                    const currentTotal = (invoiceDoc.data() as Invoice).totalAmount;
                    const additionalCost = additionalDays * admission.facilityCostPerDay;

                    const newItemRef = doc(collection(invoiceRef, 'items'));
                    const stayItem = {
                        name: `In-patient Stay: ${admission.facilityName} (x${additionalDays} days)`,
                        quantity: additionalDays,
                        unitCost: admission.facilityCostPerDay,
                        totalCost: additionalCost,
                        createdAt: serverTimestamp(),
                    };
                    batch.set(newItemRef, stayItem);
                    batch.update(invoiceRef, { totalAmount: currentTotal + additionalCost });
                }
            }

            // 3. Commit batch
            commitBatch(batch, `discharge patient ${admission.patientId}`, () => {
                toast({
                    title: 'Patient Discharged',
                    description: `${admission.patientName} has been discharged and final billing has been calculated.`,
                });
                setDischargingId(null);
            }, (error) => {
                console.error('Discharge commit failed:', error);
                toast({
                    variant: 'destructive',
                    title: 'Discharge Failed',
                    description: 'The patient could not be discharged. Please try again.',
                });
                setDischargingId(null);
            });

        } catch (error) {
            console.error("Discharge failed:", error);
            toast({
                variant: 'destructive',
                title: 'Discharge Failed',
                description: 'An unexpected error occurred during the discharge process.',
            });
            setDischargingId(null);
        }
    };


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
                                            <ConfirmationDialog
                                                trigger={
                                                    <Button variant="outline" size="sm" disabled={dischargingId === admission.id}>
                                                         {dischargingId === admission.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Discharge'}
                                                    </Button>
                                                }
                                                title={`Discharge ${admission.patientName}?`}
                                                description="This will mark the patient as discharged and bill them for the duration of their stay. This action cannot be undone."
                                                onConfirm={() => handleDischarge(admission)}
                                                confirmText="Confirm Discharge"
                                            />
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
