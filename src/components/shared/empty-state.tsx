'use client';

import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: React.ElementType;
    message: string;
    description?: string;
    className?: string;
}

export function EmptyState({ icon: Icon, message, description, className }: EmptyStateProps) {
    return (
        <div className={cn("text-center p-8 text-muted-foreground", className)}>
            <Icon className="h-12 w-12 mx-auto mb-4 text-primary/80" />
            <p className="font-semibold text-lg text-foreground">{message}</p>
            {description && <p className="text-sm mt-1">{description}</p>}
        </div>
    );
}
