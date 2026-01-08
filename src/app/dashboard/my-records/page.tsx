
'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, File, Trash2, Loader2, Image as ImageIcon, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

type RecordFile = {
  id: string;
  name: string;
  fileType: 'image' | 'pdf';
  recordType: 'prescription' | 'report';
  url: string;
  date: string;
  size: string;
};

const initialRecords: RecordFile[] = [
    { id: 'rec1', name: 'Blood Test Report.pdf', fileType: 'pdf', recordType: 'report', url: '#', date: '2024-06-15', size: '1.2 MB'},
    { id: 'rec2', name: 'X-Ray Scan', fileType: 'image', recordType: 'report', url: 'https://picsum.photos/seed/xray/800/600', date: '2024-05-20', size: '2.5 MB'},
    { id: 'rec3', name: 'Prescription_Dr_Anika.jpg', fileType: 'image', recordType: 'prescription', url: 'https://picsum.photos/seed/prescription/800/600', date: '2024-05-10', size: '800 KB' }
];

export default function MyHealthRecordsPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<RecordFile[]>(initialRecords);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState<'prescription' | 'report' | ''>('');
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

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
            date: new Date().toISOString(), // Use ISO string for accurate sorting
            size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
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

    const recordsSorted = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const storagePercentage = (records.length / maxRecords) * 100;

    return (
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
                    <CardDescription>You can upload photos (JPEG, PNG) or PDF files. PDFs are counted as a single report.</CardDescription>
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
                        {recordsSorted.map(record => (
                            <Card key={record.id} className="group overflow-hidden">
                                <CardContent className="p-0">
                                    {record.fileType === 'image' ? (
                                        <Image src={record.url} alt={record.name} width={400} height={300} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-48 bg-secondary flex flex-col items-center justify-center text-center p-4">
                                            <File className="h-16 w-16 text-muted-foreground" />
                                            <p className="text-sm mt-2 text-muted-foreground font-semibold truncate">{record.name}</p>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-4 border-t">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold truncate">{record.name}</h3>
                                            <p className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()} &bull; {record.size}</p>
                                        </div>
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
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant={record.fileType === 'pdf' ? 'destructive' : 'secondary'}>{record.fileType.toUpperCase()}</Badge>
                                        <Badge variant="outline" className="capitalize">{record.recordType}</Badge>
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
    );
}

    