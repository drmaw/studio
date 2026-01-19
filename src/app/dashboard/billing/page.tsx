
'use client'

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, PlusCircle, Search, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, addDocument } from "@/firebase";
import { collection, serverTimestamp, orderBy, query, limit, startAfter, getDocs, type DocumentSnapshot } from "firebase/firestore";
import type { Invoice } from "@/lib/definitions";
import { PageHeader } from "@/components/shared/page-header";
import { usePatientSearch } from "@/hooks/use-patient-search";
import { PatientInfoCard } from "@/components/shared/patient-info-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { FormattedDate } from "@/components/shared/formatted-date";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

export default function BillingPage() {
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResult,
        handleSearch,
    } = usePatientSearch();

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchInvoices = async (loadMore = false) => {
        if (!currentUser || !firestore) return;
        
        if(loadMore) setIsLoadingMore(true); else setIsLoading(true);

        const invoicesRef = collection(firestore, 'organizations', currentUser.organizationId, 'invoices');
        let q;
        if (loadMore && lastVisible) {
            q = query(invoicesRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
        } else {
            q = query(invoicesRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
        }

        try {
            const documentSnapshots = await getDocs(q);
            const newInvoices = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
            
            setHasMore(newInvoices.length === PAGE_SIZE);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
            setInvoices(prev => loadMore ? [...prev, ...newInvoices] : newInvoices);
        } catch (error) {
            console.error("Error fetching invoices: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch invoices." });
        } finally {
            if(loadMore) setIsLoadingMore(false); else setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && firestore) {
            fetchInvoices();
        }
    }, [currentUser, firestore]);

    const handleCreateInvoice = () => {
        if (!currentUser || !firestore || !searchResult || searchResult === 'not_found') return;
        
        const newInvoice = {
            patientId: searchResult.id,
            patientName: searchResult.name,
            organizationId: currentUser.organizationId,
            status: 'draft' as const,
            totalAmount: 0,
            createdAt: serverTimestamp(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        };

        const invoicesRef = collection(firestore, 'organizations', currentUser.organizationId, 'invoices');
        addDocument(invoicesRef, newInvoice, (docRef) => {
            if (docRef) {
                toast({
                    title: 'Invoice Created',
                    description: `A new draft invoice has been created for ${searchResult.name}.`,
                });
                router.push(`/dashboard/billing/${docRef.id}`);
            }
        }, () => {
             toast({
                variant: "destructive",
                title: "Failed to Create Invoice",
                description: "The invoice could not be created. Please try again.",
            });
        });
    };

    const searchedPatient = searchResult !== 'not_found' ? searchResult : null;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Invoicing"
                description="Create and manage invoices for patients."
            />
             <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Find Patient to Invoice</CardTitle>
                    <CardDescription>Find a patient by their Health ID or mobile number.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Enter Health ID or Mobile Number..." 
                                className="pl-8" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={() => handleSearch()} disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isSearching && (
                <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            )}
            
            {searchResult === 'not_found' && (
                 <EmptyState
                    icon={UserX}
                    message="No Patient Found"
                    description="No patient record matches the provided ID or mobile number."
                 />
            )}

            {searchedPatient && (
                <PatientInfoCard 
                    patient={searchedPatient}
                    actionSlot={
                        <Button onClick={handleCreateInvoice}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Invoice
                        </Button>
                    }
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Existing Invoices</CardTitle>
                    <CardDescription>A list of all invoices for your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length > 0 ? (
                                invoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.patientName}</TableCell>
                                        <TableCell><FormattedDate date={invoice.createdAt} formatString="dd-MM-yyyy" /></TableCell>
                                        <TableCell><FormattedDate date={invoice.dueDate} formatString="dd-MM-yyyy" /></TableCell>
                                        <TableCell className="font-mono">BDT {invoice.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                invoice.status === 'paid' ? 'default' :
                                                invoice.status === 'draft' ? 'secondary' :
                                                'destructive'
                                            } className="capitalize">{invoice.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/billing/${invoice.id}`)}>
                                                View <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No invoices found for this organization.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="justify-center py-4">
                    {hasMore && (
                        <Button onClick={() => fetchInvoices(true)} disabled={isLoadingMore}>
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
