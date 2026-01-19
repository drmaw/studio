'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollectionGroup, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { MedicalRecord, User, FHIR_Bundle, FHIR_Patient, FHIR_Observation } from '@/lib/definitions';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function generateFHIRBundle(user: User, records: MedicalRecord[]): FHIR_Bundle {
    const patientId = user.id;

    // 1. Create Patient Resource
    const fhirPatient: FHIR_Patient = {
        resourceType: 'Patient',
        id: patientId,
        identifier: [{
            system: 'urn:system:digi-health-id',
            value: user.healthId,
        }],
        name: [{ text: user.name }],
        gender: user.demographics?.gender?.toLowerCase() as FHIR_Patient['gender'] || 'unknown',
        birthDate: user.demographics?.dob,
    };

    // 2. Create Observation Resources
    const fhirObservations: FHIR_Observation[] = records.map(record => {
        const diagnosisParts = record.diagnosis.split(' - ');
        const diagnosisCode = diagnosisParts[0];
        const diagnosisText = diagnosisParts[1] || diagnosisCode;

        return {
            resourceType: 'Observation',
            id: record.id,
            status: 'final',
            code: {
                coding: [{
                    system: 'http://hl7.org/fhir/sid/icd-10',
                    code: diagnosisCode,
                    display: diagnosisText,
                }],
                text: record.diagnosis,
            },
            subject: { reference: `Patient/${patientId}` },
            effectiveDateTime: record.date,
            performer: [{ reference: `Practitioner/${record.doctorId}` }],
            note: record.notes ? [{ text: record.notes }] : undefined,
        };
    });

    // 3. Assemble Bundle
    const bundle: FHIR_Bundle = {
        resourceType: 'Bundle',
        id: `bundle-for-${patientId}`,
        type: 'collection',
        entry: [
            {
                fullUrl: `urn:uuid:${fhirPatient.id}`,
                resource: fhirPatient,
            },
            ...fhirObservations.map(obs => ({
                fullUrl: `urn:uuid:${obs.id}`,
                resource: obs,
            })),
        ],
    };

    return bundle;
}


export default function DeveloperPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const [fhirBundle, setFhirBundle] = useState<FHIR_Bundle | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const recordsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collectionGroup(firestore, 'records'), where('patientId', '==', user.id));
    }, [firestore, user]);

    const { data: records, isLoading: recordsLoading } = useCollectionGroup<MedicalRecord>(recordsQuery);

    const handleGenerate = () => {
        if (!user || !records) return;
        setIsGenerating(true);
        const bundle = generateFHIRBundle(user, records);
        setFhirBundle(bundle);
        setIsGenerating(false);
    };

    const handleDownload = () => {
        if (!fhirBundle) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirBundle, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `fhir_bundle_${user?.healthId}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={<><Code className="h-8 w-8" /> Developer Tools</>}
                description="Tools for data export and interoperability."
            />

            <Card>
                <CardHeader>
                    <CardTitle>FHIR Data Export</CardTitle>
                    <CardDescription>
                        Generate and view your personal health data as a FHIR R4 Bundle. This demonstrates how your data can be shared with other healthcare systems.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={handleGenerate} disabled={isGenerating || recordsLoading}>
                            {isGenerating || recordsLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                            ) : (
                                "Generate My FHIR Data"
                            )}
                        </Button>
                        {fhirBundle && (
                            <Button variant="outline" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download JSON
                            </Button>
                        )}
                    </div>
                    {fhirBundle && (
                        <ScrollArea className="h-96 w-full rounded-md border bg-muted p-4">
                            <pre className="text-sm">
                                {JSON.stringify(fhirBundle, null, 2)}
                            </pre>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
