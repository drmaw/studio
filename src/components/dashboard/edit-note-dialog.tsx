
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
import { type MedicalRecord } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { useFirestore } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export function EditNoteDialog({ record, patientId }: { record: MedicalRecord, patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(record.notes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSave = () => {
    if (!patientId || !firestore) return;
    setIsSaving(true);
    
    const recordRef = doc(firestore, "patients", patientId, "medical_records", record.id);
    const updateData = { notes: note };
    
    updateDoc(recordRef, updateData)
        .then(() => {
            setIsOpen(false);
            toast({
              title: "Note Saved",
              description: "The medical record has been updated successfully.",
            });
        })
        .catch(async (serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: recordRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        })
        .finally(() => {
            setIsSaving(false);
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
            Update the notes for the diagnosis of '{record.diagnosis}' on {record.date}.
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
