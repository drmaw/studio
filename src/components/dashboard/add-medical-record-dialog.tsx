
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
import { Loader2, Plus, ChevronsUpDown } from "lucide-react"
import { useFirestore, commitBatch, writeBatch } from "@/firebase"
import { collection, serverTimestamp, doc } from "firebase/firestore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { icd10Codes } from "@/lib/medical-codes"

export function AddMedicalRecordDialog({ patient, doctor }: { patient: User, doctor: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  // State for the diagnosis combobox
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCodes = icd10Codes.filter(code => 
    code.description.toLowerCase().includes(searchValue.toLowerCase()) ||
    code.code.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSave = () => {
    if (!diagnosis || !firestore || !doctor.organizationId) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Diagnosis or active organization is missing.'});
        return;
    };
    setIsSaving(true);
    
    const batch = writeBatch(firestore);

    // 1. Create the medical record in the correct organization subcollection
    const recordsPath = `organizations/${doctor.organizationId}/medical_records/${patient.id}/records`;
    const newRecordRef = doc(collection(firestore, recordsPath));

    const newRecord = {
        patientId: patient.id,
        doctorId: doctor.healthId,
        doctorName: `Dr. ${doctor.name}`,
        organizationId: doctor.organizationId,
        date: new Date().toISOString(),
        diagnosis,
        notes,
        createdAt: serverTimestamp(),
    };
    batch.set(newRecordRef, newRecord);

    // 2. Create the privacy log entry
    const logRef = doc(collection(firestore, 'patients', patient.id, 'privacy_log'));
    const logEntry = {
        actorId: doctor.healthId,
        actorName: doctor.name,
        actorAvatarUrl: doctor.avatarUrl,
        patientId: patient.id,
        organizationId: doctor.organizationId,
        action: 'add_record' as const,
        details: `Diagnosis: ${diagnosis}`,
        timestamp: serverTimestamp(),
    };
    batch.set(logRef, logEntry);
    
    commitBatch(batch, 'add medical record and log', () => {
        setDiagnosis('');
        setNotes('');
        setIsOpen(false);
        toast({
            title: "Record Added",
            description: "The new medical record has been saved successfully.",
        });
        setIsSaving(false);
    }, () => {
        setIsSaving(false);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "The medical record could not be saved.",
        });
    });
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
          <DialogTitle>Add New Medical Record for {patient.name}</DialogTitle>
          <DialogDescription>
            This record will be created under the currently active organization: <span className="font-semibold">{doctor.organizationName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className="w-full justify-between"
                        >
                            <span className="truncate">{diagnosis || "Select diagnosis..."}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0">
                         <div className="p-2 border-b">
                            <Input 
                                placeholder="Search diagnosis..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <ScrollArea className="h-60">
                            <div className="p-1">
                            {filteredCodes.length > 0 ? filteredCodes.map((code) => (
                                <div
                                    key={code.code}
                                    onClick={() => {
                                        setDiagnosis(`${code.code} - ${code.description}`)
                                        setPopoverOpen(false)
                                        setSearchValue('')
                                    }}
                                    className="cursor-pointer p-2 hover:bg-accent rounded-md text-sm"
                                >
                                    <span className="font-bold">{code.code}:</span> {code.description}
                                </div>
                            )) : <div className="p-2 text-center text-sm text-muted-foreground">No diagnosis found.</div>}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
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
