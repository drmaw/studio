
'use client';

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, updateDocument } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';


interface UpgradeToPremiumButtonProps extends ButtonProps {
    asChild?: boolean;
    children?: ReactNode;
}

export function UpgradeToPremiumButton({ asChild = false, children, className, ...props }: UpgradeToPremiumButtonProps) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = () => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not upgrade. User not found.',
            });
            return;
        }

        setIsUpgrading(true);

        const userRef = doc(firestore, 'users', user.id);
        updateDocument(userRef, { isPremium: true }, () => {
            toast({
                title: 'Upgrade Successful!',
                description: 'You are now a premium member.',
            });
            setIsUpgrading(false);
        }, () => {
            setIsUpgrading(false);
        });
    };

    const Comp = asChild ? Slot : Button;

    const defaultContent = (
        <>
            {isUpgrading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Upgrade to Premium
        </>
    );

    return (
        <Comp onClick={handleUpgrade} disabled={isUpgrading || user?.isPremium} {...props} className={cn(className)}>
            {asChild ? children : children || defaultContent}
        </Comp>
    );
}
