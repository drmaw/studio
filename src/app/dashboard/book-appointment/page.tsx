

'use client'

import { useState } from "react";
import type { Patient, User, DoctorSchedule, Organization } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, QrCode, AlertTriangle, Phone, ShieldCheck, HeartPulse, Siren, UserX, Loader2, Hospital, CalendarDays, Clock, BookOpenCheck, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrScannerDialog } from "@/components/dashboard/qr-scanner-dialog";
import { collection, getDocs, query, where, limit, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useCollection, useDoc, useFirestore, useMemoFirebase, addDocument } from "@/firebase";
import { BookAppointmentDialog } from "@/components/dashboard/book-appointment-dialog";


type CombinedPatient = User & Partial<Patient>;

// This card is similar to the one in doctor-dashboard, but without the "View Full Records" button
function PatientInfoCard({ patient }: { patient: CombinedPatient }) {
  const patientInitials = patient.name.split(' ').map(n => n[0]).join('');
  return (
    <Card className="bg-background mt-6">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
         <Avatar className="h-20 w-20">
            <AvatarImage src={patient.avatarUrl} />
            <AvatarFallback className="text-2xl">{patientInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{patient.name}</CardTitle>
            <CardDescription className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Health ID: {patient.healthId}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {patient.demographics?.mobileNumber}</span>
              <span>DOB: {patient.demographics?.dob}</span>
              <span>{patient.demographics?.gender}</span>
            </CardDescription>
          </div>
      </CardHeader>
       <CardContent>
        {patient.redFlag && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{patient.redFlag.title}</AlertTitle>
            <AlertDescription>
              <p>{patient.redFlag.comment}</p>
            </AlertDescription>
          </Alert>
        )}
       </CardContent>
    </Card>
  )
}

export default function BookAppointmentPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchedPatient, setSearchedPatient] = useState<CombinedPatient | null | 'not_found'>(null);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();

    const orgDocRef = useMemoFirebase(() => {
        if (!firestore || !currentUser) return null;
        return doc(firestore, 'organizations', currentUser.organizationId);
    }, [firestore, currentUser]);

    const { data: organization, isLoading: orgLoading } = useDoc<Organization>(orgDocRef);
    
    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser) return null;
        return query(collection(firestore, 'organizations', currentUser.organizationId, 'schedules'));
    }, [firestore, currentUser]);

    const { data: schedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);

    const handleSearch = async (id?: string) => {
        const finalQuery = id || searchQuery;
        if (!finalQuery || !currentUser || !firestore) {
            toast({
                variant: "destructive",
                title: "Search field is empty",
                description: "Please enter a Patient Health ID or Mobile Number.",
            });
            return;
        }
        
        setIsSearching(true);
        setSearchedPatient(null);

        try {
            const usersRef = collection(firestore, "users");
            const isHealthId = /^\d{10}$/.test(finalQuery); 
            
            const q = isHealthId 
                ? query(usersRef, where("healthId", "==", finalQuery), limit(1))
                : query(usersRef, where("demographics.mobileNumber", "==", finalQuery), limit(1));

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const patientUser = { id: userDoc.id, ...userDoc.data() } as User;
                
                const patientDocRef = doc(firestore, "patients", patientUser.id);
                const patientDocSnap = await getDoc(patientDocRef);
                const patientData = patientDocSnap.exists() ? patientDocSnap.data() as Patient : null;

                const combinedData: CombinedPatient = {
                    ...patientUser,
                    ...patientData,
                    id: patientUser.id,
                };
                setSearchedPatient(combinedData);
                
                // Log the search action
                const logRef = collection(firestore, 'patients', combinedData.id, 'privacy_log');
                const logEntry = {
                    actorId: currentUser.healthId,
                    actorName: currentUser.name,
                    actorAvatarUrl: currentUser.avatarUrl,
                    patientId: combinedData.id,
                    organizationId: currentUser.organizationId,
                    action: 'search' as const,
                    timestamp: serverTimestamp(),
                };
                addDocument(logRef, logEntry);

            } else {
                setSearchedPatient('not_found');
            }

        } catch (error) {
            console.error("Patient search failed:", error);
            toast({
                variant: "destructive",
                title: "Search Failed",
                description: "An error occurred while searching for the patient.",
            });
            setSearchedPatient('not_found');
        }

        setIsSearching(false);
        if (id) {
            setSearchQuery(id);
        }
    }
    
    const handleQrScan = (decodedId: string) => {
        handleSearch(decodedId);
    }
    
    const isLoading = orgLoading || schedulesLoading;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <BookOpenCheck className="h-8 w-8" />
                    Book an Appointment
                </h1>
                <p className="text-muted-foreground">
                    Search for a patient and book a consultation with an available doctor.
                </p>
            </div>

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>1. Find Patient</CardTitle>
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
                        <QrScannerDialog onScan={handleQrScan}>
                            <Button variant="outline" size="icon">
                                <QrCode className="h-5 w-5"/>
                                <span className="sr-only">Scan QR</span>
                            </Button>
                        </QrScannerDialog>
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
            
            {searchedPatient === 'not_found' && (
                 <Card className="flex flex-col items-center justify-center p-12 bg-background-soft border-dashed">
                    <UserX className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Patient Found</h3>
                    <p className="text-muted-foreground">No patient record matches the provided ID or mobile number.</p>
                </Card>
            )}

            {searchedPatient && searchedPatient !== 'not_found' && (
                <>
                    <PatientInfoCard patient={searchedPatient} />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Doctor & Schedule</CardTitle>
                            <CardDescription>Choose an available doctor to book an appointment for {searchedPatient.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> :
                            schedules && schedules.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {schedules.map(schedule => (
                                        <Card key={schedule.id} className="flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><UserIcon /> {schedule.doctorName}</CardTitle>
                                                <CardDescription>Room: {schedule.roomNumber} | Fee: {schedule.fee} BDT</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span>{schedule.days.join(', ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{schedule.startTime} - {schedule.endTime}</span>
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                {currentUser && organization && <BookAppointmentDialog schedule={schedule} organization={organization} patient={searchedPatient} />}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-muted-foreground">No doctor schedules found for your organization.</div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
