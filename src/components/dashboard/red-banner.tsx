'use client'

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Edit, Save, Trash2, XCircle } from "lucide-react";
import type { Role } from "@/lib/definitions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

    const handleSave = async () => {
        // Mock API call to save the comment (disease name)
        console.log(`Saving red flag for patient ${patientId}:`, comment);
        await new Promise(resolve => setTimeout(resolve, 500));
        setRedFlag(prev => ({ ...prev, comment }));
        setIsEditing(false);
        toast({
            title: "Alert Saved",
            description: "The critical alert has been updated.",
        });
    };

    const handleDelete = async () => {
        // Mock API call to delete the red flag
        console.log(`Deleting red flag for patient ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsVisible(false);
        toast({
            title: "Alert Removed",
            description: "The critical alert has been removed for this patient.",
        });
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
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive_ghost">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the critical alert for this patient.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Alert</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Alert>
    );
}
