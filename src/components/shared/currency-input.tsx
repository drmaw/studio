import * as React from 'react';
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends React.ComponentProps<"input"> {}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className={cn("relative", className)}>
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" className="pl-7" ref={ref} {...props} />
            </div>
        );
    }
);
CurrencyInput.displayName = "CurrencyInput";
