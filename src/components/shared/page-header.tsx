import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string | ReactNode;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
        <div className="space-y-1">
            {typeof title === 'string' ? (
                 <h1 className="text-3xl font-bold">{title}</h1>
            ) : (
                <div className="text-3xl font-bold flex items-center gap-2">{title}</div>
            )}
            <p className="text-muted-foreground">{description}</p>
        </div>
        {children && <div>{children}</div>}
    </div>
  );
}
