
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import type { User, Facility, Invoice, Bed } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase, addDocument, commitBatch, writeBatch } from '@/firebase';
import { collection, serverTimestamp, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNotification } from '@/lib/notifications';

interface AdmitPatientDialogProps {
  patient: User;
  organizationId: string;
}

interface SelectedBedInfo {
    facilityId: string;
    facilityName: string;
    bedId: string;
    costPerDay: number;
}

export function AdmitPatientDialog({ patient, organizationId }: AdmitPatientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [selectedBedInfo, setSelectedBedInfo] = useState<SelectedBedInfo | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'facilities');
  }, [firestore, organizationId]);

  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);

  const handleAdmit = async () => {
    if (!firestore || !selectedBedInfo) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an available bed.' });
      return;
    }
    setIsAdmitting(true);

    const batch = writeBatch(firestore);

    // 1. Create the new admission record
    const admissionsRef = collection(firestore, 'organizations', organizationId, 'admissions');
    const newAdmissionRef = doc(admissionsRef);
    const newAdmission = {
      patientId: patient.id,
      patientName: patient.name,
      organizationId: organizationId,
      facilityId: selectedBedInfo.facilityId,
      facilityName: selectedBedInfo.facilityName,
      bedId: selectedBedInfo.bedId,
      facilityCostPerDay: selectedBedInfo.costPerDay,
      admissionDate: serverTimestamp(),
      status: 'admitted' as const,
      createdAt: serverTimestamp(),
    };
    batch.set(newAdmissionRef, newAdmission);
    
    // 2. Update bed status to 'occupied'
    const facilityRef = doc(firestore, 'organizations', organizationId, 'facilities', selectedBedInfo.facilityId);
    batch.update(facilityRef, {
        [`beds.${selectedBedInfo.bedId}.status`]: 'occupied',
        [`beds.${selectedBedInfo.bedId}.patientId`]: patient.id,
        [`beds.${selectedBedInfo.bedId}.patientName`]: patient.name,
    });


    // 3. Find an existing invoice or prepare to create a new one
    const invoicesRef = collection(firestore, 'organizations', organizationId, 'invoices');
    const invoiceQuery = query(
      invoicesRef,
      where('patientId', '==', patient.id),
      where('status', 'in', ['draft', 'open']),
      limit(1)
    );
    const invoiceSnapshot = await getDocs(invoiceQuery);
    
    let invoiceRef;
    let currentTotal = 0;
    
    if (!invoiceSnapshot.empty) {
        const invoiceDoc = invoiceSnapshot.docs[0];
        invoiceRef = invoiceDoc.ref;
        currentTotal = (invoiceDoc.data() as Invoice).totalAmount;
    } else {
        invoiceRef = doc(invoicesRef);
        const newInvoice = {
            patientId: patient.id,
            patientName: patient.name,
            organizationId: organizationId,
            status: 'draft' as const,
            totalAmount: 0,
            createdAt: serverTimestamp(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        batch.set(invoiceRef, newInvoice);
    }
    
    // 4. Add the admission cost as a line item
    const newItemRef = doc(collection(invoiceRef, 'items'));
    const admissionItem = {
      name: `Admission: ${selectedBedInfo.facilityName} (${selectedBedInfo.bedId.replace('bed-', 'Bed ')})`,
      quantity: 1,
      unitCost: selectedBedInfo.costPerDay,
      totalCost: selectedBedInfo.costPerDay,
      createdAt: serverTimestamp(),
    };
    batch.set(newItemRef, admissionItem);
    
    // 5. Update the invoice total
    batch.update(invoiceRef, { totalAmount: currentTotal + selectedBedInfo.costPerDay });

    // 6. Commit all batched writes
    commitBatch(batch, `admit patient ${patient.id} and create invoice item`, async () => {
        await createNotification(
            firestore,
            patient.id,
            'You Have Been Admitted',
            `You have been admitted to ${selectedBedInfo.facilityName}.`,
            '/dashboard'
        );
        toast({
            title: 'Patient Admitted',
            description: `${patient.name} has been admitted and an admission charge has been added to their invoice.`,
        });
        setIsOpen(false);
        setIsAdmitting(false);
    }, () => {
        setIsAdmitting(false);
        toast({
            variant: 'destructive',
            title: 'Admission Failed',
            description: 'The patient could not be admitted. Please try again.',
        });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Admit Patient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admit {patient.name}</DialogTitle>
          <DialogDescription>
            Select an available bed to admit the patient to. An admission charge will be added to their invoice automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p>
            You are about to admit{' '}
            <span className="font-semibold">{patient.name}</span> into your
            organization.
          </p>
          {facilitiesLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Select
              onValueChange={(value) => {
                const [facilityId, bedId] = value.split(';');
                const facility = facilities?.find(f => f.id === facilityId);
                if (facility && bedId) {
                  setSelectedBedInfo({
                    facilityId: facility.id,
                    facilityName: facility.name,
                    bedId: bedId,
                    costPerDay: facility.costPerDay
                  });
                } else {
                  setSelectedBedInfo(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an available bed..." />
              </SelectTrigger>
              <SelectContent>
                {facilities?.map((facility) => (
                    <SelectGroup key={facility.id}>
                        <SelectLabel>{facility.name} ({facility.type})</SelectLabel>
                        {Object.values(facility.beds)
                            .filter(bed => bed.status === 'available')
                            .map(bed => (
                                <SelectItem key={`${facility.id}-${bed.id}`} value={`${facility.id};${bed.id}`}>
                                    {bed.id.replace('bed-', 'Bed ')} - BDT {facility.costPerDay.toFixed(2)}/day
                                </SelectItem>
                            ))}
                    </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdmit}
            disabled={isAdmitting || !selectedBedInfo}
          >
            {isAdmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Admission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
