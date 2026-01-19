
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, FileText } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { RecordFile } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormattedDate } from '@/components/shared/formatted-date';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

interface RecordCardProps {
    record: RecordFile;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onView: () => void;
}

export function RecordCard({ record, isSelected, onToggleSelect, onDelete, onView }: RecordCardProps) {
    return (
        <Card className={cn("group overflow-hidden flex flex-col relative bg-card", isSelected && "ring-2 ring-primary")}>
            <div className="absolute top-2 left-2 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(record.id)}
                    aria-label={`Select record: ${record.name}`}
                    className="bg-background/50 hover:bg-background data-[state=checked]:bg-primary"
                />
            </div>
            <CardContent className="p-0 cursor-pointer" onClick={onView}>
                <div className="aspect-video bg-muted flex items-center justify-center">
                    {record.fileType === 'image' ? (
                        <Image src={record.url} alt={record.name} width={400} height={300} className="w-full h-full object-cover" />
                    ) : (
                        <FileText className="w-16 h-16 text-muted-foreground" />
                    )}
                </div>
            </CardContent>
            <div className="p-4 border-t flex flex-col flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate flex-1 pr-2">{record.name}</h3>
                    <ConfirmationDialog
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                        title="Are you sure?"
                        description={`This will permanently delete your record "${record.name}". This action cannot be undone.`}
                        onConfirm={() => onDelete(record.id)}
                        confirmText="Delete"
                    />
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant={record.fileType === 'pdf' ? 'destructive' : 'secondary'}>{record.fileType.toUpperCase()}</Badge>
                    <Badge variant="outline" className="capitalize">{record.recordType}</Badge>
                </div>
                <div className="flex-1" />
                <p className="text-xs text-muted-foreground mt-4">
                    <FormattedDate date={record.createdAt} formatString="dd-MM-yyyy, hh:mm a" fallback="N/A" />
                </p>
            </div>
        </Card>
    );
}
