

'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, File, Trash2, Loader2, Image as ImageIcon, Sparkles, User, Clock, MoreHorizontal, Download } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { RecordViewer } from '@/components/dashboard/record-viewer';
import type { RecordFile } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, commitBatchNonBlocking } from '@/firebase/non-blocking-updates';


// Client-side only component to format date and avoid hydration mismatch
const FormattedDate = ({ date }: { date: string | Date }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        const d = typeof date === 'string' ? new Date(date) : date;
        setFormattedDate(format(d, "dd-MM-yyyy"));
    }, [date]);

    if (!formattedDate) {
        return null;
    }

    return <span>{formattedDate}</span>;
}


export default function MyHealthRecordsPage() {
    const { user, loading } = useAuth();
    const firestore = useFirestore();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState<'prescription' | 'report' | ''>('');
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    
    const recordsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'patients', user.id, 'record_files'), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: records, isLoading: recordsLoading } = useCollection<RecordFile>(recordsQuery);

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
        if (!selectedFile || !recordType || !user) return;

        setIsUploading(true);
        
        try {
            const storage = getStorage();
            const filePath = `record_files/${user.id}/${Date.now()}-${selectedFile.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            const recordFilesRef = collection(firestore, 'patients', user.id, 'record_files');

            const newRecord = {
                name: selectedFile.name,
                fileType: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
                recordType: recordType,
                url: downloadURL,
                size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
                uploadedBy: user.id,
                uploaderName: user.name,
                patientId: user.id,
                organizationId: user.organizationId,
                createdAt: serverTimestamp(),
            };

            addDocumentNonBlocking(recordFilesRef, newRecord);

            toast({
                title: 'Upload successful',
                description: `Your file "${selectedFile.name}" has been uploaded.`,
            });
            
        } catch (error) {
            console.error("Upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your file.'});
        } finally {
            setSelectedFile(null);
            setRecordType('');
            setIsUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        if(!user) return;
        const docRef = doc(firestore, 'patients', user.id, 'record_files', id);
        deleteDocumentNonBlocking(docRef);
        setSelectedRecords(prev => prev.filter(selectedId => selectedId !== id));
        toast({
            title: 'Record deleted',
            description: 'The selected health record has been removed.',
        })
    }

    const handleDeleteSelected = () => {
        if (!user || selectedRecords.length === 0) return;
        
        const batch = writeBatch(firestore);
        selectedRecords.forEach(id => {
            const docRef = doc(firestore, 'patients', user.id, 'record_files', id);
            batch.delete(docRef);
        });

        commitBatchNonBlocking(batch, { operation: 'delete', path: `patients/${user.id}/record_files` });
        
        toast({
            title: `${selectedRecords.length} records deleted`,
            description: 'The selected health records have been removed.',
        });
        setSelectedRecords([]);
    };

    const handleDownloadSelected = () => {
        // This is a mock download. In a real app, you'd generate a zip or similar.
        toast({
            title: `Downloading ${selectedRecords.length} records...`,
            description: 'Your download will start shortly.',
        });
        setSelectedRecords([]);
    };
    
    const toggleRecordSelection = (id: string) => {
        setSelectedRecords(prev => 
            prev.includes(id) ? prev.filter(recordId => recordId !== id) : [...prev, id]
        );
    };
    
    const toggleSelectAll = () => {
        if (!records) return;
        if (selectedRecords.length === records.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(records.map(r => r.id));
        }
    };

    const openRecordViewer = (index: number) => {
        if (selectedRecords.length > 0) return;
        setViewerStartIndex(index);
        setViewerOpen(true);
    }
    
    const currentRecords = records || [];
    const storagePercentage = (currentRecords.length / maxRecords) * 100;

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <>
            <RecordViewer 
                records={currentRecords}
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                startIndex={viewerStartIndex}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Health Records</h1>
                    <p className="text-muted-foreground">Upload, manage, and view your personal medical documents.</p>
                </div>

                <Card className="bg-card">
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
                            <span>{currentRecords.length} / {maxRecords} reports</span>
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
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Your Documents</h2>
                        {selectedRecords.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {selectedRecords.length} selected
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Actions</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleDownloadSelected}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download selected
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete selected
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete {selectedRecords.length} record(s).
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                     <div className="flex items-center space-x-2 pb-2">
                        <Checkbox 
                            id="select-all"
                            checked={currentRecords.length > 0 && selectedRecords.length === currentRecords.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Select All
                        </label>
                    </div>

                    {recordsLoading && <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>}

                    {!recordsLoading && currentRecords.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentRecords.map((record, index) => (
                                <Card key={record.id} className={cn("group overflow-hidden flex flex-col relative bg-card", selectedRecords.includes(record.id) && "ring-2 ring-primary")}>
                                     <div className="absolute top-2 left-2 z-10">
                                        <Checkbox 
                                            checked={selectedRecords.includes(record.id)}
                                            onCheckedChange={() => toggleRecordSelection(record.id)}
                                            className="bg-background/50 hover:bg-background data-[state=checked]:bg-primary"
                                        />
                                    </div>
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
                                                        <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
                                                {record.createdAt && <FormattedDate date={(record.createdAt as any).toDate()} />}
                                                <span className="font-semibold text-foreground/80">&bull; {record.size}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3" />
                                                <span>Uploaded by: <span className="font-semibold text-foreground/80">{record.uploaderName}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        !recordsLoading && 
                        <Card className="flex items-center justify-center p-12 bg-background-soft">
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

    