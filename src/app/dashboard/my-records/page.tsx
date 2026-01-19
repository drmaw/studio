
'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Trash2, Loader2, Image as ImageIcon, MoreHorizontal, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecordViewer } from '@/components/dashboard/record-viewer';
import type { RecordFile } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase, addDocument, deleteDocument, commitBatch, writeBatch } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { UpgradeToPremiumButton } from '@/components/shared/upgrade-to-premium-button';
import { RecordCard } from '@/components/dashboard/record-card';


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
    const currentRecords = records || [];

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

    const handleUpload = () => {
        if (!selectedFile || !recordType || !user || !firestore) return;

        if (currentRecords.length >= maxRecords) {
            toast({
                variant: 'destructive',
                title: 'Storage Limit Reached',
                description: `You cannot upload more than ${maxRecords} records. Upgrade to premium for more space.`,
            });
            return;
        }

        setIsUploading(true);
        
        const storage = getStorage();
        const filePath = `record_files/${user.id}/${Date.now()}-${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        
        uploadBytes(storageRef, selectedFile).then(uploadResult => {
            return getDownloadURL(uploadResult.ref);
        }).then(downloadURL => {
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

            addDocument(recordFilesRef, newRecord, (docRef) => {
                if (docRef) {
                    toast({
                        title: 'Upload successful',
                        description: `Your file "${selectedFile.name}" has been uploaded.`,
                    });
                }
                 setSelectedFile(null);
                setRecordType('');
                setIsUploading(false);
            });
        }).catch(error => {
            console.error("Upload failed: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your file.'});
            setIsUploading(false);
        });
    };

    const handleDelete = (id: string) => {
        if(!user || !firestore) return;
        const docRef = doc(firestore, 'patients', user.id, 'record_files', id);
        
        deleteDocument(docRef, () => {
            setSelectedRecords(prev => prev.filter(selectedId => selectedId !== id));
            toast({
                title: 'Record deleted',
                description: 'The selected health record has been removed.',
            });
        });
    }

    const handleDeleteSelected = () => {
        if (!user || !firestore || selectedRecords.length === 0) return;
        
        const batch = writeBatch(firestore);
        selectedRecords.forEach(id => {
            const docRef = doc(firestore, 'patients', user.id, 'record_files', id);
            batch.delete(docRef);
        });

        commitBatch(batch, `delete ${selectedRecords.length} records`, () => {
            toast({
                title: `${selectedRecords.length} records deleted`,
                description: 'The selected health records have been removed.',
            });
            setSelectedRecords([]);
        });
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
                <PageHeader 
                    title="My Health Records"
                    description="Upload, manage, and view your personal medical documents."
                />

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
                                <UpgradeToPremiumButton />
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
                                        <ConfirmationDialog
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete selected
                                                </DropdownMenuItem>
                                            }
                                            title="Are you absolutely sure?"
                                            description={`This action cannot be undone. This will permanently delete ${selectedRecords.length} record(s).`}
                                            onConfirm={handleDeleteSelected}
                                            confirmText="Delete"
                                        />
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
                               <RecordCard
                                    key={record.id}
                                    record={record}
                                    isSelected={selectedRecords.includes(record.id)}
                                    onToggleSelect={toggleRecordSelection}
                                    onDelete={handleDelete}
                                    onView={() => openRecordViewer(index)}
                                />
                            ))}
                        </div>
                    ) : (
                        !recordsLoading && 
                        <EmptyState 
                            icon={ImageIcon}
                            message="No Records Yet"
                            description="You haven't uploaded any records yet."
                        />
                    )}
                </div>
            </div>
        </>
    );
}
