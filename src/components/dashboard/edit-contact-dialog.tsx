

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
import { type EmergencyContact, type User } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Loader2, Pencil } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"


export function EditContactDialog({ contact, onSave }: { contact: EmergencyContact, onSave: (contact: EmergencyContact) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [name, setName] = useState(contact.name || '');
  const [relation, setRelation] = useState(contact.relation);
  const [contactNumber, setContactNumber] = useState(contact.contactNumber || '');
  const [healthId, setHealthId] = useState(contact.healthId || '');
  
  const contactType = contact.healthId ? 'healthId' : 'details';
  const [editMethod, setEditMethod] = useState(contactType);

  useEffect(() => {
    // Reset state if dialog is reopened with a different contact
    setName(contact.name || '');
    setRelation(contact.relation);
    setContactNumber(contact.contactNumber || '');
    setHealthId(contact.healthId || '');
    setEditMethod(contact.healthId ? 'healthId' : 'details');
  }, [contact, isOpen]);

  const handleSave = async () => {
    let updatedContact: EmergencyContact = { ...contact };
    
    if (editMethod === 'details') {
        if (!name || !relation || !contactNumber) {
            toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Please fill all fields.'});
            return;
        }
        updatedContact = { ...updatedContact, name, relation, contactNumber, healthId: undefined };
    } else { // healthId
        if (!healthId || !relation) {
            toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Health ID and relation are required.'});
            return;
        }
        const userDocRef = doc(firestore, 'users', healthId);
        const contactUserDoc = await getDoc(userDocRef);
        if (!contactUserDoc.exists()) {
            toast({ variant: "destructive", title: "User not found", description: "No user exists with that Health ID."});
            return;
        }
        const contactUser = contactUserDoc.data() as User;
        updatedContact = { ...updatedContact, name: contactUser.name, healthId, relation, contactNumber: undefined };
    }


    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
        <div className="py-4">
             <Tabs value={editMethod} onValueChange={setEditMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Edit Details</TabsTrigger>
                    <TabsTrigger value="healthId">Edit by Health ID</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="pt-4 space-y-2">
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
                </TabsContent>
                <TabsContent value="healthId" className="pt-4 space-y-2">
                    <div className="space-y-1">
                        <Label htmlFor="healthId">Health ID</Label>
                        <Input id="healthId" value={healthId} onChange={e => setHealthId(e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="relation-hid">Relation</Label>
                        <Input id="relation-hid" value={relation} onChange={e => setRelation(e.target.value)} />
                    </div>
                </TabsContent>
            </Tabs>
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
