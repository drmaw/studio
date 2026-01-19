
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
import type { User, Invoice } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, Beaker } from "lucide-react"
import { useFirestore, commitBatch, writeBatch } from "@/firebase"
import { collection, serverTimestamp, doc, query, where, getDocs, limit } from "firebase/firestore"

export function OrderTestDialog({ patient, doctor }: { patient: User, doctor: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tests, setTests] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSave = async () => {
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

    try {
      const batch = writeBatch(firestore);

      // 1. Create the LabTestOrder
      const labOrdersRef = collection(firestore, 'organizations', doctor.organizationId, 'lab_test_orders');
      const newOrderRef = doc(labOrdersRef);
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
      batch.set(newOrderRef, newOrder);

      // 2. Mock Price List & Calculate Total
      const testPrices: { [key: string]: number } = {
        'Complete Blood Count (CBC)': 450,
        'Serum Creatinine': 250,
        'Lipid Profile': 800,
        'Urine R/E': 150,
        'HbA1c': 500,
        'TSH': 400,
        'FT4': 400,
      };
      const testsToBill = testsList.map(name => ({ name: name.trim(), cost: testPrices[name.trim()] || 200 }));
      const orderTotalCost = testsToBill.reduce((sum, test) => sum + test.cost, 0);

      // 3. Find an existing invoice or prepare to create a new one
      const invoicesRef = collection(firestore, 'organizations', doctor.organizationId, 'invoices');
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
              organizationId: doctor.organizationId,
              status: 'draft' as const,
              totalAmount: 0,
              createdAt: serverTimestamp(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
          batch.set(invoiceRef, newInvoice);
      }
      
      // 4. Update the invoice total
      batch.update(invoiceRef, { totalAmount: currentTotal + orderTotalCost });
      
      // 5. Add invoice items
      for (const test of testsToBill) {
          const newItemRef = doc(collection(invoiceRef, 'items'));
          const newItem = {
              name: `Lab Test: ${test.name}`,
              quantity: 1,
              unitCost: test.cost,
              totalCost: test.cost,
              createdAt: serverTimestamp(),
          };
          batch.set(newItemRef, newItem);
      }
      
      // 6. Commit all writes
      commitBatch(batch, 'create lab order and bill items', () => {
          setTests('');
          setIsOpen(false);
          toast({
              title: "Test Order Created",
              description: `A new lab order has been created and billed to ${patient.name}.`,
          });
          setIsSaving(false);
      }, (error) => {
          console.error('Failed to commit lab order batch:', error);
          setIsSaving(false);
          toast({
              variant: "destructive",
              title: "Order Failed",
              description: "The lab test order could not be created or billed. Please try again.",
          });
      });

    } catch (error) {
        console.error('Error during lab order save:', error);
        setIsSaving(false);
        toast({
            variant: "destructive",
            title: "An Unexpected Error Occurred",
            description: "The lab test order could not be created.",
        });
    }
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
            Enter the tests to be ordered, one per line. The cost will be automatically added to the patient's invoice.
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
