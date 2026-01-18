
'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { useFirestore } from "@/firebase"
import { addDoc, collection, serverTimestamp, writeBatch, doc } from "firebase/firestore"
import { format } from 'date-fns'

export function AddMedicalRecordDialog({ patient, doctor }: { patient: User, doctor: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSave = async () => {
    if (!diagnosis || !firestore) {
        toast({ variant: 'destructive', title: 'Diagnosis Required', description: 'Please enter a diagnosis.'});
        return;
    };
    setIsSaving(true);
    
    try {
        const batch = writeBatch(firestore);

        // 1. Create the medical record
        const recordsRef = collection(firestore, "patients", patient.id, "medical_records");
        const newRecord = {
            patientId: patient.id,
            doctorId: doctor.healthId,
            doctorName: doctor.name,
            organizationId: doctor.organizationId,
            date: format(new Date(), 'dd-MM-yyyy'),
            diagnosis,
            notes,
            createdAt: serverTimestamp(),
        };
        batch.set(doc(recordsRef), newRecord);

        // 2. Create the privacy log entry
        const logRef = collection(firestore, 'patients', patient.id, 'privacy_log');
        const logEntry = {
            actorId: doctor.healthId,
            actorName: doctor.name,
            actorAvatarUrl: doctor.avatarUrl,
            patientId: patient.id,
            organizationId: doctor.organizationId,
            action: 'add_record' as const,
            timestamp: serverTimestamp(),
        };
        batch.set(doc(logRef), logEntry);
        
        await batch.commit();

        setDiagnosis('');
        setNotes('');
        setIsOpen(false);
        toast({
          title: "Record Added",
          description: "The new medical record has been saved successfully.",
        });
    } catch (error) {
        console.error("Failed to save record:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the new medical record.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Medical Record</DialogTitle>
          <DialogDescription>
            Create a new medical record for {patient.name}. The current date will be used.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input 
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g., Acute Bronchitis"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    placeholder="Enter observations, prescriptions, and advice..."
                />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving || !diagnosis}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
