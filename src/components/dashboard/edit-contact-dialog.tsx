

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
import { type EmergencyContact } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Loader2, Pencil } from "lucide-react"

export function EditContactDialog({ contact, onSave }: { contact: EmergencyContact, onSave: (contact: EmergencyContact) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
        // If the contact was linked by Health ID, it might not have a contactNumber.
        // We prioritize existing details but ensure fields are ready for editing.
        setName(contact.name || '');
        setRelation(contact.relation || '');
        setContactNumber(contact.contactNumber || '');
    }
  }, [contact, isOpen]);

  const handleSave = async () => {
    if (!name || !relation || !contactNumber) {
        toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Please fill all fields.'});
        return;
    }
    
    const updatedContact: EmergencyContact = {
        ...contact,
        name,
        relation,
        contactNumber,
        healthId: undefined, // Always clear healthId to convert it to a manual contact
    };

    setIsSaving(true);
    
    // Simulate async operation for UI feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSave(updatedContact);
    
    setIsSaving(false);
    setIsOpen(false);
    toast({
      title: "Contact Updated",
      description: "The emergency contact has been updated successfully.",
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Emergency Contact</DialogTitle>
          <DialogDescription>
            Update the details for this contact.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="relation">Relation</Label>
                <Input id="relation" value={relation} onChange={e => setRelation(e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input id="contactNumber" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            </div>
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
