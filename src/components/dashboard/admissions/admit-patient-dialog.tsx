
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
import type { User, Facility, Invoice } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase, addDocument, commitBatch, writeBatch } from '@/firebase';
import { collection, serverTimestamp, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNotification } from '@/lib/notifications';

interface AdmitPatientDialogProps {
  patient: User;
  organizationId: string;
}

export function AdmitPatientDialog({ patient, organizationId }: AdmitPatientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'facilities');
  }, [firestore, organizationId]);

  const { data: facilities, isLoading: facilitiesLoading } = useCollection<Facility>(facilitiesQuery);

  const handleAdmit = async () => {
    if (!firestore || !selectedFacility) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a facility.' });
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
      facilityId: selectedFacility.id,
      facilityName: selectedFacility.name,
      facilityCostPerDay: selectedFacility.cost,
      admissionDate: serverTimestamp(),
      status: 'admitted' as const,
      createdAt: serverTimestamp(),
    };
    batch.set(newAdmissionRef, newAdmission);

    // 2. Find an existing invoice or prepare to create a new one
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
    
    // 3. Add the admission cost as a line item
    const newItemRef = doc(collection(invoiceRef, 'items'));
    const admissionItem = {
      name: `Admission: ${selectedFacility.name} (${selectedFacility.type})`,
      quantity: 1,
      unitCost: selectedFacility.cost,
      totalCost: selectedFacility.cost,
      createdAt: serverTimestamp(),
    };
    batch.set(newItemRef, admissionItem);
    
    // 4. Update the invoice total
    batch.update(invoiceRef, { totalAmount: currentTotal + selectedFacility.cost });

    // 5. Commit all batched writes
    commitBatch(batch, `admit patient ${patient.id} and create invoice item`, async () => {
        await createNotification(
            firestore,
            patient.id,
            'You Have Been Admitted',
            `You have been admitted to ${selectedFacility.name}.`,
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
            Select a facility to admit the patient to. An admission charge will be added to their invoice automatically.
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
                const facility = facilities?.find(f => f.id === value) || null;
                setSelectedFacility(facility);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a ward or cabin..." />
              </SelectTrigger>
              <SelectContent>
                {facilities?.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name} ({facility.type}) - BDT {facility.cost.toFixed(2)}/day
                  </SelectItem>
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
            disabled={isAdmitting || !selectedFacility}
          >
            {isAdmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Admission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
