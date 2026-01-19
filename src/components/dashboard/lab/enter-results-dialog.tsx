'use client'

import { useState } from 'react'
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
import type { User, LabTestOrder } from "@/lib/definitions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ClipboardEdit } from "lucide-react"
import { useFirestore, commitBatch, writeBatch } from "@/firebase"
import { collection, serverTimestamp, doc, query, where, limit, getDocs } from "firebase/firestore"
import { ScrollArea } from '@/components/ui/scroll-area'
import { createNotification } from '@/lib/notifications'

type ResultsState = { [testName: string]: { value: string; comments: string } };

export function EnterResultsDialog({ order, currentUser }: { order: LabTestOrder, currentUser: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const initialResultsState = order.tests.reduce((acc, test) => {
    acc[test] = { value: '', comments: '' };
    return acc;
  }, {} as ResultsState);

  const [results, setResults] = useState<ResultsState>(initialResultsState);
  
  const handleResultChange = (testName: string, field: 'value' | 'comments', inputValue: string) => {
      setResults(prev => ({
          ...prev,
          [testName]: {
              ...prev[testName],
              [field]: inputValue
          }
      }));
  };
  
  const isFormValid = () => {
      return Object.values(results).every(result => result.value.trim() !== '');
  }

  const handleSave = async () => {
    if (!isFormValid()) {
        toast({ variant: 'destructive', title: 'Missing Results', description: 'Please enter a result value for every test.' });
        return;
    }
    if (!firestore || !currentUser.organizationId) return;

    setIsSaving(true);
    
    const batch = writeBatch(firestore);

    // 1. Update the LabTestOrder status
    const orderRef = doc(firestore, 'organizations', currentUser.organizationId, 'lab_test_orders', order.id);
    batch.update(orderRef, { status: 'completed' });

    // 2. Create a LabTestResult for each test
    for (const testName in results) {
        const resultData = results[testName];
        const resultsRef = doc(collection(orderRef, 'results'));
        const newResult = {
            patientId: order.patientId,
            organizationId: currentUser.organizationId,
            testName: testName,
            resultValue: resultData.value,
            comments: resultData.comments,
            reportedById: currentUser.healthId,
            reportedByName: currentUser.name,
            createdAt: serverTimestamp(),
        };
        batch.set(resultsRef, newResult);
    }
    
    commitBatch(batch, 'enter lab results and complete order', async () => {
        // 3. Notify the ordering doctor
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('healthId', '==', order.doctorId), limit(1));
        const doctorSnapshot = await getDocs(q);

        if (!doctorSnapshot.empty) {
            const doctorDoc = doctorSnapshot.docs[0];
            await createNotification(
                firestore,
                doctorDoc.id, // Doctor's Auth UID
                'Lab Results Ready',
                `Lab results for patient ${order.patientName} are now available.`,
                `/dashboard/patients/${order.patientId}`
            );
        } else {
             console.warn(`Could not find doctor with healthId ${order.doctorId} to send notification.`)
        }

        setIsOpen(false);
        toast({
            title: 'Results Saved',
            description: `The results for order #${order.id.substring(0, 6)} have been saved.`,
        });
        setIsSaving(false);
    }, () => {
        setIsSaving(false);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "The results could not be saved. Please try again.",
        });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
            <ClipboardEdit className="mr-2 h-4 w-4" />
            Enter Results
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Lab Results for {order.patientName}</DialogTitle>
          <DialogDescription>
            Order ID: {order.id.substring(0, 6)}... | Enter the values for each test below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
            <div className="py-4 space-y-6 pr-4">
                {order.tests.map(test => (
                    <div key={test} className="space-y-3 p-4 border rounded-lg bg-background-soft">
                        <Label htmlFor={`value-${test}`} className="text-base font-semibold">{test}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`value-${test}`}>Result Value*</Label>
                                <Input
                                    id={`value-${test}`}
                                    value={results[test].value}
                                    onChange={(e) => handleResultChange(test, 'value', e.target.value)}
                                    placeholder="e.g., 12.5 g/dL"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`comments-${test}`}>Comments (Optional)</Label>
                                <Input
                                    id={`comments-${test}`}
                                    value={results[test].comments}
                                    onChange={(e) => handleResultChange(test, 'comments', e.target.value)}
                                    placeholder="e.g., Normal range: 12-16"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving || !isFormValid()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & Complete Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
