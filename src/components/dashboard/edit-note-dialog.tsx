

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
import { Textarea } from "@/components/ui/textarea"
import { type MedicalRecord, type User } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { useFirestore, writeBatch, commitBatch } from "@/firebase"
import { doc, serverTimestamp, collection } from "firebase/firestore"
import { FormattedDate } from "../shared/formatted-date"

export function EditNoteDialog({ record, patientId, doctor }: { record: MedicalRecord, patientId: string, doctor: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(record.notes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSave = () => {
    if (!patientId || !firestore || !record.organizationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save note, missing required information.'});
      return;
    }
    setIsSaving(true);
    
    const batch = writeBatch(firestore);
    
    const recordRef = doc(firestore, "organizations", record.organizationId, "medical_records", patientId, "records", record.id);
    batch.update(recordRef, { notes: note });
    
    const logRef = doc(collection(firestore, 'patients', patientId, 'privacy_log'));
    batch.set(logRef, {
        actorId: doctor.healthId,
        actorName: doctor.name,
        actorAvatarUrl: doctor.avatarUrl,
        patientId: patientId,
        organizationId: doctor.organizationId,
        action: 'edit_record' as const,
        details: `For record with diagnosis: ${record.diagnosis}`,
        timestamp: serverTimestamp(),
    });

    commitBatch(batch, 'update medical record and log', () => {
        setIsOpen(false);
        toast({
            title: "Note Saved",
            description: "The medical record has been updated successfully.",
        });
        setIsSaving(false);
    }, () => {
        setIsSaving(false);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "The medical record could not be updated.",
        });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Medical Note</DialogTitle>
          <DialogDescription>
            Update the notes for the diagnosis of '{record.diagnosis}' on <FormattedDate date={record.date} formatString="dd-MM-yyyy" />.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={8}
            placeholder="Enter medical notes here..."
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
