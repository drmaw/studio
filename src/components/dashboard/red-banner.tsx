
'use client'

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Edit, Save, Trash2, XCircle } from "lucide-react";
import type { Role } from "@/lib/definitions";
import { useFirestore, updateDocument } from "@/firebase";
import { doc } from "firebase/firestore";
import { ConfirmationDialog } from "../shared/confirmation-dialog";

type RedBannerProps = {
    patientId: string;
    initialRedFlag: { title: string; comment: string };
    currentUserRole: Role;
};

export function RedBanner({ initialRedFlag, currentUserRole, patientId }: RedBannerProps) {
    const { toast } = useToast();
    const [redFlag, setRedFlag] = useState(initialRedFlag);
    const [comment, setComment] = useState(initialRedFlag.comment);
    const [isEditing, setIsEditing] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const firestore = useFirestore();

    const handleSave = async () => {
        if (!patientId || !firestore) return;
        const patientRef = doc(firestore, 'patients', patientId);
        const updateData = { redFlag: { title: redFlag.title, comment: comment } };
        
        const success = await updateDocument(patientRef, updateData);
        
        if (success) {
            setRedFlag(prev => ({ ...prev, comment }));
            setIsEditing(false);
            toast({
                title: "Alert Saved",
                description: "The critical alert has been updated.",
            });
        }
    };

    const handleDelete = async () => {
        if (!patientId || !firestore) return;
        const patientRef = doc(firestore, 'patients', patientId);
        const updateData = { redFlag: null };

        const success = await updateDocument(patientRef, updateData);
        
        if (success) {
            setIsVisible(false);
            toast({
                title: "Alert Removed",
                description: "The critical alert has been removed for this patient.",
            });
        }
    };

    if (!isVisible) {
        return null;
    }

    const isDoctor = currentUserRole === 'doctor';

    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <AlertTitle>{redFlag.title}</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                        {isEditing && isDoctor ? (
                            <Textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Enter disease name (e.g., HIV Positive)"
                                rows={2}
                            />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap pt-1">{comment || 'No condition specified.'}</p>
                        )}
                    </AlertDescription>
                </div>
                {isDoctor && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isEditing ? (
                            <>
                                <Button size="sm" variant="secondary" onClick={() => { setIsEditing(false); setComment(redFlag.comment); }}>
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    <Save className="mr-2 h-4 w-4" /> Save
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="sm" variant="ghost" className="text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <ConfirmationDialog
                                    trigger={<Button size="sm" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>}
                                    title="Are you sure?"
                                    description="This action cannot be undone. This will permanently delete the critical alert for this patient."
                                    onConfirm={handleDelete}
                                    confirmText="Delete Alert"
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </Alert>
    );
}
