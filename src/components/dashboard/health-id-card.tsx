
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type User, type Patient } from "@/lib/definitions";
import { Camera, QrCode, ShieldCheck, Phone, Cake, HeartPulse, Siren, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { differenceInYears, parse, isValid } from 'date-fns';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, setDocument } from "@/firebase";

export function HealthIdCard({ user, patient }: { user: User, patient: Patient | null }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [age, setAge] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user: authUser } = useAuth();
    const firestore = useFirestore();


    useEffect(() => {
        if (user?.demographics?.dob) {
            try {
                // The date is stored as yyyy-MM-dd
                const birthDate = parse(user.demographics.dob, "yyyy-MM-dd", new Date());
                if(isValid(birthDate)) {
                    setAge(differenceInYears(new Date(), birthDate));
                }
            } catch {
                setAge(null);
            }
        }
    }, [user?.demographics?.dob]);

    const userInitials = (user?.name || '').split(' ').map(n => n[0]).join('');
    // Use the 10-digit healthId for the QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${user?.healthId}`;
    const largeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user?.healthId}`;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !authUser || !firestore) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Please select an image smaller than 2MB.',
            });
            return;
        }

        setIsUploading(true);
        const storage = getStorage();
        const filePath = `profile_pictures/${authUser.id}`;
        const storageRef = ref(storage, filePath);
        
        uploadBytes(storageRef, file)
            .then(snapshot => getDownloadURL(snapshot.ref))
            .then(downloadURL => {
                const userDocRef = doc(firestore, 'users', authUser.id);
                const updateData = { avatarUrl: downloadURL };
                setDocument(userDocRef, updateData, { merge: true }, () => {
                     toast({
                        title: 'Profile Picture Updated',
                        description: 'Your new picture has been saved.',
                    });
                    setIsUploading(false);
                }, () => {
                    setIsUploading(false);
                });
            })
            .catch(error => {
                console.error("Profile picture upload failed:", error);
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'Could not upload your new profile picture.',
                });
                setIsUploading(false);
            });
    };
    
    if (!user) {
        return null;
    }
    
    const displayName = user.name;

    return (
        <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative group">
                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={handleAvatarClick}
                        >
                            {isUploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div className="overflow-hidden">
                        <h2 className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{user.roles.includes('doctor') ? `Dr. ${displayName}` : displayName}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Health ID: {user.healthId}</div>
                            {user.demographics?.mobileNumber && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user.demographics.mobileNumber}</div>}
                            {age !== null && <div className="flex items-center gap-1.5"><Cake className="h-4 w-4" /> Age: {age}</div>}
                        </div>
                         <div className="flex flex-wrap gap-2 pt-3">
                            {user.roles && user.roles.map(role => (
                                <Badge key={role} variant="secondary" className="capitalize">
                                    {role.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-3">
                        {patient?.chronicConditions && patient.chronicConditions.length > 0 && (
                            <div className="flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-primary" />
                                <div className="flex flex-wrap gap-1">
                                    {patient.chronicConditions.map(c => <Badge key={c} variant="outline" className="capitalize">{c}</Badge>)}
                                </div>
                            </div>
                        )}
                        {patient?.allergies && patient.allergies.length > 0 && (
                             <div className="flex items-center gap-2">
                                <Siren className="h-5 w-5 text-destructive" />
                                <div className="flex flex-wrap gap-1">
                                    {patient.allergies.map(a => <Badge key={a} variant="destructive" className="capitalize bg-destructive/10 text-destructive-foreground border-destructive/20">{a}</Badge>)}
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="flex-shrink-0">
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="cursor-pointer p-2 border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
                                     <Image src={qrCodeUrl} alt="Health ID QR Code" width={80} height={80} />
                                     <p className="text-xs font-mono tracking-widest bg-muted px-2 py-1 rounded-md">{user.healthId}</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md items-center flex flex-col">
                                <DialogHeader>
                                    <DialogTitle className="text-center">Health ID: {user.healthId}</DialogTitle>
                                </DialogHeader>
                                <Image src={largeQrCodeUrl} alt="Enlarged QR Code" width={400} height={400} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
