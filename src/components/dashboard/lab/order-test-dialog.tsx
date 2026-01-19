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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Beaker } from "lucide-react"
import { useFirestore, addDocument } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"

export function OrderTestDialog({ patient, doctor }: { patient: User, doctor: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tests, setTests] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSave = () => {
    if (!tests || !firestore || !doctor.organizationId) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please list at least one test to order.'});
        return;
    };
    setIsSaving(true);
    
    const testsList = tests.split('\n').filter(t => t.trim() !== '');

    if (testsList.length === 0) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please list at least one test to order.'});
        setIsSaving(false);
        return;
    }

    const labOrdersRef = collection(firestore, 'organizations', doctor.organizationId, 'lab_test_orders');

    const newOrder = {
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.healthId,
        doctorName: `Dr. ${doctor.name}`,
        organizationId: doctor.organizationId,
        tests: testsList,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
    };

    addDocument(labOrdersRef, newOrder, (docRef) => {
        if (docRef) {
            setTests('');
            setIsOpen(false);
            toast({
                title: "Test Order Created",
                description: `A new lab test order has been created for ${patient.name}.`,
            });
        }
        setIsSaving(false);
    }, () => {
        setIsSaving(false);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "The lab test order could not be created.",
        });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Beaker className="mr-2 h-4 w-4" />
          Order Tests
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Lab Tests for {patient.name}</DialogTitle>
          <DialogDescription>
            Enter the tests to be ordered, one per line. This will create a new order for the lab department.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="tests">Tests to Order</Label>
                <Textarea 
                    id="tests"
                    value={tests}
                    onChange={(e) => setTests(e.target.value)}
                    rows={8}
                    placeholder="e.g.,&#10;Complete Blood Count (CBC)&#10;Serum Creatinine&#10;Lipid Profile"
                />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving || !tests}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
