
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
import type { User, Facility } from '@/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase, addDocument } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNotification } from '@/lib/notifications';

interface AdmitPatientDialogProps {
  patient: User;
  organizationId: string;
}

export function AdmitPatientDialog({ patient, organizationId }: AdmitPatientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string } | null>(null);
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

    const admissionsRef = collection(firestore, 'organizations', organizationId, 'admissions');
    const newAdmission = {
      patientId: patient.id,
      patientName: patient.name,
      organizationId: organizationId,
      facilityId: selectedFacility.id,
      facilityName: selectedFacility.name,
      admissionDate: serverTimestamp(),
      status: 'admitted' as const,
      createdAt: serverTimestamp(),
    };

    addDocument(admissionsRef, newAdmission,
      async (docRef) => {
        if (docRef) {
          await createNotification(
            firestore,
            patient.id,
            'You Have Been Admitted',
            `You have been admitted to ${selectedFacility.name}.`,
            '/dashboard'
          );
          toast({
            title: 'Patient Admitted',
            description: `${patient.name} has been admitted to ${selectedFacility.name}.`,
          });
          setIsOpen(false);
        }
        setIsAdmitting(false);
      },
      () => {
        setIsAdmitting(false);
        toast({
            variant: 'destructive',
            title: 'Admission Failed',
            description: 'The patient could not be admitted. Please try again.',
        });
      }
    );
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
            Select a facility to admit the patient to.
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
                const facility = facilities?.find(f => f.id === value);
                if (facility) setSelectedFacility({ id: facility.id, name: facility.name });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a ward or cabin..." />
              </SelectTrigger>
              <SelectContent>
                {facilities?.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name} ({facility.type})
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
