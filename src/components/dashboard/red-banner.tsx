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
        // Mock API call to save the comment
        console.log(`Saving comment for patient ${patientId}:`, comment);
        await new Promise(resolve => setTimeout(resolve, 500));
        setRedFlag(prev => ({ ...prev, comment }));
        setIsEditing(false);
        toast({
            title: "Comment Saved",
            description: "The red flag comment has been updated.",
        });
    };

    const handleDelete = async () => {
        // Mock API call to delete the red flag
        console.log(`Deleting red flag for patient ${patientId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsVisible(false);
        toast({
            title: "Red Flag Removed",
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
            <div className="flex justify-between items-start">
                <div>
                    <AlertTitle>{redFlag.title}</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2 pr-4">
                        {isEditing && isDoctor ? (
                            <Textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                            />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap">{comment || 'No comments added.'}</p>
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
                                        <Button size="sm" variant="ghost">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the red flag alert for this patient.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>Delete Alert</AlertDialogAction>
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
