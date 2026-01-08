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

export function EditNoteDialog({ record }: { record: MedicalRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(record.notes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    // Mock saving the data
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Saving note for record ${record.id}:`, note);
    // In a real app, you would update the database here.
    // The data source `medicalRecords` won't actually update in this mock.
    setIsSaving(false);
    setIsOpen(false);
    toast({
      title: "Note Saved",
      description: "The medical record has been updated successfully.",
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
