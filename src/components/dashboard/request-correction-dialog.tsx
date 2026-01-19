
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type MedicalRecord, type User } from "@/lib/definitions";
import { useFirestore } from "@/firebase";
import { createNotification } from "@/lib/notifications";
import { query, collection, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, MessageSquareWarning } from 'lucide-react';

interface RequestCorrectionDialogProps {
  record: MedicalRecord;
  patient: User;
}

export function RequestCorrectionDialog({ record, patient }: RequestCorrectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async () => {
    if (!reason) {
      toast({ variant: 'destructive', title: 'Reason required', description: 'Please explain the correction you are requesting.' });
      return;
    }
    if (!firestore) return;

    setIsSubmitting(true);

    try {
      // 1. Find the doctor's auth ID from their health ID
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('healthId', '==', record.doctorId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Could not find the doctor to notify.');
      }

      const doctorDoc = querySnapshot.docs[0];
      const doctorAuthId = doctorDoc.id;

      // 2. Create the notification for the doctor
      const title = `Correction Request from ${patient.name}`;
      const description = `Patient has requested a correction for a record dated ${record.date.substring(0, 10)}. Reason: "${reason}"`;
      const href = `/dashboard/patients/${patient.id}`;

      await createNotification(firestore, doctorAuthId, title, description, href);
      
      toast({ title: 'Request Sent', description: 'Your correction request has been sent to the doctor.' });
      setIsOpen(false);
      setReason('');

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Send Request', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquareWarning className="mr-2 h-4 w-4" />
          Request Correction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Correction</DialogTitle>
          <DialogDescription>
            Submit a request to the doctor to correct information in this medical record. Please be specific.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <div className="p-3 border rounded-md bg-muted/50 text-sm">
                <p><strong>Record Date:</strong> {record.date.substring(0, 10)}</p>
                <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                <p><strong>Doctor:</strong> {record.doctorName}</p>
            </div>
          <Label htmlFor="reason">What needs to be corrected?</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., 'The notes mention a medication I am not taking.' or 'The diagnosis code seems incorrect.'"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
