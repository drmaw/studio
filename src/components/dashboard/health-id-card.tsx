'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type User } from "@/lib/definitions";
import { Camera, Mail, QrCode } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";

export function HealthIdCard({ user }: { user: User }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const userInitials = user.name.split(' ').map(n => n[0]).join('');
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
        <Card>
            <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex-shrink-0 relative group">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                <div className="flex-1">
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                    <CardDescription className="text-base pt-1 flex items-center gap-2 justify-center sm:justify-start">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                    </CardDescription>
                     <div className="flex flex-wrap gap-2 pt-3 justify-center sm:justify-start">
                        {user.roles.map(role => (
                            <Badge key={role} variant="secondary" className="capitalize">
                                {role.replace('_', ' ')}
                            </Badge>
                        ))}
                    </div>
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
            </CardHeader>
        </Card>
    );
}
