
'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, File as FileIcon, Clock, User, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import type { RecordFile } from '@/lib/definitions';
import { Badge } from '../ui/badge';
import { FormattedDate } from '../shared/formatted-date';

type RecordViewerProps = {
  records: RecordFile[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RecordViewer = ({ records, startIndex, open, onOpenChange }: RecordViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(startIndex);
    }
  }, [open, startIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % records.length);
  }, [records.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + records.length) % records.length);
  }, [records.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleNext, handlePrev]);

  if (!records || records.length === 0) {
    return null;
  }

  const currentRecord = records[currentIndex];

  if (!currentRecord) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">{currentRecord.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-xs">
             <span className='flex items-center gap-1'><Clock className="h-3 w-3" /> <FormattedDate date={currentRecord.createdAt} formatString="dd-MM-yyyy, hh:mm a" /></span>
            <span className='flex items-center gap-1'><User className="h-3 w-3" /> Uploaded by {currentRecord.uploaderName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 bg-muted/20 flex items-center justify-center overflow-hidden relative">
          {currentRecord.fileType === 'image' ? (
            <Image
              src={currentRecord.url}
              alt={currentRecord.name}
              fill
              className="object-contain"
            />
          ) : (
            <iframe src={currentRecord.url} className="w-full h-full" title={currentRecord.name}>
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileIcon className="h-24 w-24" />
                    <p className="mt-4">PDF preview not available.</p>
                    <Button asChild variant="link" className="mt-2">
                        <a href={currentRecord.url} target="_blank" rel="noopener noreferrer">
                            Open in new tab <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </iframe>
          )}

          {records.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/50 hover:bg-background/80"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/50 hover:bg-background/80"
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-background">
            <div className="flex items-center gap-2">
                <Badge variant={currentRecord.fileType === 'pdf' ? 'destructive' : 'secondary'}>{currentRecord.fileType.toUpperCase()}</Badge>
                <Badge variant="outline" className="capitalize">{currentRecord.recordType}</Badge>
                <span className="text-sm text-muted-foreground font-mono">{currentRecord.size}</span>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {records.length}
                </span>
                <Button variant="outline" size="sm" asChild>
                    <a href={currentRecord.url} download={currentRecord.name}>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Preview = ({ record }: { record: RecordFile }): ReactNode => {
    return (
        <div className="aspect-video bg-muted flex items-center justify-center">
            {record.fileType === 'image' ? (
                <Image src={record.url} alt={record.name} width={400} height={300} className="w-full h-full object-cover" />
            ) : (
                <FileIcon className="w-16 h-16 text-muted-foreground" />
            )}
        </div>
    );
};


const Footer = ({ record }: { record: RecordFile }): ReactNode => {
    return (
        <p className="text-xs text-muted-foreground mt-4">
            <FormattedDate date={record.createdAt} formatString="dd-MM-yyyy, hh:mm a" fallback="N/A" />
        </p>
    );
};

RecordViewer.Preview = Preview;
RecordViewer.Footer = Footer;

export { RecordViewer };
