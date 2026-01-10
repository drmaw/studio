
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type User } from "@/lib/definitions";
import { Camera, QrCode, ShieldCheck, Phone, Cake, HeartPulse, Siren } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { differenceInYears, parseISO, isValid } from 'date-fns';

export function HealthIdCard({ user }: { user: User }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [age, setAge] = useState<number | null>(null);

    useEffect(() => {
        if (user.demographics?.dob) {
            try {
                const birthDate = parseISO(user.demographics.dob);
                if(isValid(birthDate)) {
                    setAge(differenceInYears(new Date(), birthDate));
                }
            } catch {
                setAge(null);
            }
        }
    }, [user.demographics?.dob]);

    const userInitials = (user.name || '').split(' ').map(n => n[0]).join('');
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user.id}`;
    const largeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user.id}`;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast({
                title: 'Profile Picture Selected',
                description: `${file.name} is ready to be uploaded.`,
            });
        }
    };

    return (
        <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative group">
                        <Avatar className="h-24 w-24 border-2 border-primary/20 rounded-lg">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-3xl rounded-lg">{userInitials}</AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={handleAvatarClick}
                        >
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                    </div>
                    
                    <div className="overflow-hidden">
                        <h2 className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{user.name || 'Loading...'}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Health ID: {user.id}</div>
                            {user.demographics?.mobileNumber && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user.demographics.mobileNumber}</div>}
                            {age !== null && <div className="flex items-center gap-1.5"><Cake className="h-4 w-4" /> Age: {age}</div>}
                        </div>
                         <div className="flex flex-wrap gap-2 pt-3">
                            {user.roles?.map(role => (
                                <Badge key={role} variant="secondary" className="capitalize">
                                    {role.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-3">
                        {user.demographics?.chronicConditions && user.demographics.chronicConditions.length > 0 && (
                            <div className="flex items-center gap-2">
                                <HeartPulse className="h-5 w-5 text-primary" />
                                <div className="flex flex-wrap gap-1">
                                    {user.demographics.chronicConditions.map(c => <Badge key={c} variant="outline" className="capitalize">{c}</Badge>)}
                                </div>
                            </div>
                        )}
                        {user.demographics?.allergies && user.demographics.allergies.length > 0 && (
                             <div className="flex items-center gap-2">
                                <Siren className="h-5 w-5 text-destructive" />
                                <div className="flex flex-wrap gap-1">
                                    {user.demographics.allergies.map(a => <Badge key={a} variant="destructive" className="capitalize bg-destructive/10 text-destructive-foreground border-destructive/20">{a}</Badge>)}
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="flex-shrink-0">
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="cursor-pointer p-2 border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
                                     <Image src={qrCodeUrl} alt="Health ID QR Code" width={80} height={80} />
                                     <p className="text-xs font-mono tracking-widest bg-muted px-2 py-1 rounded-md">{user.id}</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md items-center flex flex-col">
                                <DialogHeader>
                                    <DialogTitle className="text-center">Health ID: {user.id}</DialogTitle>
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
