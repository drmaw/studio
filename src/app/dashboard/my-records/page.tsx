

'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, File, Trash2, Loader2, Image as ImageIcon, Sparkles, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/use-auth';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { RecordViewer } from '@/components/dashboard/record-viewer';
import type { RecordFile } from '@/lib/definitions';

const initialRecords: RecordFile[] = [
    { id: 'rec1', name: 'Blood Test Report.pdf', fileType: 'pdf', recordType: 'report', url: '#', date: '2024-06-15T10:30:00.000Z', size: '1.2 MB', uploadedBy: 'Lab Assistant' },
    { id: 'rec2', name: 'X-Ray Scan', fileType: 'image', recordType: 'report', url: 'https://picsum.photos/seed/xray/800/600', date: '2024-05-20T14:00:00.000Z', size: '2.5 MB', uploadedBy: 'Dr. Anika Rahman' },
    { id: 'rec3', name: 'Prescription_Dr_Anika.jpg', fileType: 'image', recordType: 'prescription', url: 'https://picsum.photos/seed/prescription/800/600', date: '2024-05-10T11:45:00.000Z', size: '800 KB', uploadedBy: 'Self' }
];

// Client-side only component to format date and avoid hydration mismatch
const FormattedDate = ({ date }: { date: string }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        setFormattedDate(format(new Date(date), "dd MMM yyyy, hh:mm a"));
    }, [date]);

    if (!formattedDate) {
        // You can return a placeholder here if you want
        return null;
    }

    return <span>{formattedDate}</span>;
}


export default function MyHealthRecordsPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<RecordFile[]>(initialRecords);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState<'prescription' | 'report' | ''>('');
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);

    const MAX_RECORDS_STANDARD = 10;
    const MAX_RECORDS_PREMIUM = 40;
    const maxRecords = user?.isPremium ? MAX_RECORDS_PREMIUM : MAX_RECORDS_STANDARD;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (isUploading) {
                toast({
                    variant: 'destructive',
                    title: 'Upload in progress',
                    description: 'Please wait for the current upload to finish.',
                });
                return;
            }
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast({
                variant: 'destructive',
                title: 'No file selected',
                description: 'Please select a file to upload.',
            });
            return;
        }

        if (!recordType) {
            toast({
                variant: 'destructive',
                title: 'No record type selected',
                description: 'Please select a record type (e.g., Prescription).',
            });
            return;
        }

        setIsUploading(true);
        // Mock upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newRecord: RecordFile = {
            id: `rec-${Date.now()}`,
            name: selectedFile.name,
            fileType: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
            recordType: recordType,
            url: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : '#',
            date: new Date().toISOString(),
            size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
            uploadedBy: 'Self',
        };
        
        setRecords(prev => {
            let updatedRecords = [newRecord, ...prev];
            if (updatedRecords.length > maxRecords) {
                // Remove the oldest record
                const oldestRecord = updatedRecords.reduce((oldest, current) => 
                    new Date(current.date) < new Date(oldest.date) ? current : oldest
                );
                updatedRecords = updatedRecords.filter(r => r.id !== oldestRecord.id);
                toast({
                    variant: "destructive",
                    title: "Storage Limit Reached",
                    description: `The oldest record "${oldestRecord.name}" was deleted to make space.`,
                });
            }
            return updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        
        setSelectedFile(null);
        setRecordType('');
        setIsUploading(false);
        toast({
            title: 'Upload successful',
            description: `Your file "${selectedFile.name}" has been uploaded.`,
        });
    };

    const handleDelete = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id));
        toast({
            title: 'Record deleted',
            description: 'The selected health record has been removed.',
        })
    }

    const openRecordViewer = (index: number) => {
        setViewerStartIndex(index);
        setViewerOpen(true);
    }

    const recordsSorted = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const storagePercentage = (records.length / maxRecords) * 100;

    return (
        <>
            <RecordViewer 
                records={recordsSorted}
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                startIndex={viewerStartIndex}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Health Records</h1>
                    <p className="text-muted-foreground">Upload, manage, and view your personal medical documents.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Upload New Document
                        </CardTitle>
                        <CardDescription>You can upload photos (JPEG, PNG) or PDF files. Each PDF counts as one report.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input type="file" onChange={handleFileChange} disabled={isUploading} accept="image/jpeg,image/png,application/pdf" />
                            <Select value={recordType} onValueChange={(value) => setRecordType(value as 'prescription' | 'report')} disabled={isUploading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select record type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="prescription">Prescription</SelectItem>
                                    <SelectItem value="report">Medical Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !recordType} className="w-full">
                            {isUploading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                            ) : (
                                'Upload Document'
                            )}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                        <div className="w-full flex justify-between text-sm text-muted-foreground">
                            <span>Storage Usage</span>
                            <span>{records.length} / {maxRecords} reports</span>
                        </div>
                        <Progress value={storagePercentage} />
                        {!user?.isPremium && (
                            <div className="pt-2 text-center text-sm">
                            <Button variant="link" className="p-0 h-auto text-primary">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Upgrade to Premium for {MAX_RECORDS_PREMIUM} slots
                            </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Your Documents</h2>
                    {records.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recordsSorted.map((record, index) => (
                                <Card key={record.id} className="group overflow-hidden flex flex-col">
                                    <CardContent className="p-0 cursor-pointer" onClick={() => openRecordViewer(index)}>
                                        {record.fileType === 'image' ? (
                                            <Image src={record.url} alt={record.name} width={400} height={300} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-48 bg-secondary flex flex-col items-center justify-center text-center p-4">
                                                <File className="h-16 w-16 text-muted-foreground" />
                                                <p className="text-sm mt-2 text-muted-foreground font-semibold truncate">{record.name}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-4 border-t flex flex-col flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold truncate flex-1 pr-2">{record.name}</h3>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete your record "{record.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            <Badge variant={record.fileType === 'pdf' ? 'destructive' : 'secondary'}>{record.fileType.toUpperCase()}</Badge>
                                            <Badge variant="outline" className="capitalize">{record.recordType}</Badge>
                                        </div>
                                        <div className="flex-1" />
                                        <div className="mt-4 space-y-2 text-xs text-muted-foreground pt-4 border-t border-dashed">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3"/>
                                                <FormattedDate date={record.date} />
                                                <span className="font-semibold text-foreground/80">&bull; {record.size}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3" />
                                                <span>Uploaded by: <span className="font-semibold text-foreground/80">{record.uploadedBy}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="flex items-center justify-center p-12">
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                <p>You haven't uploaded any records yet.</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
