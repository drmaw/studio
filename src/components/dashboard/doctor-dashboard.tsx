
'use client'

import { useState } from "react";
import type { Patient, User } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, QrCode, AlertTriangle, Phone, Clock, ShieldCheck, HeartPulse, Siren, UserX, Loader2, Hospital } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { QrScannerDialog } from "./qr-scanner-dialog";
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, collectionGroup, doc, getDoc } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { DoctorSchedule } from "@/lib/definitions";


type CombinedPatient = User & Partial<Patient>;

function PatientSearchResultCard({ patient }: { patient: CombinedPatient }) {
  const patientInitials = patient.name.split(' ').map(n => n[0]).join('');
  return (
    <Card className="bg-background">
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
          <Button asChild variant="default" size="sm" className="self-start">
            <Link href={`/dashboard/patients/${patient.id}`}>
              View Full Records <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {patient.redFlag && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{patient.redFlag.title}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{patient.redFlag.comment}</p>
              <Textarea placeholder="Add a note for this alert..." defaultValue="" />
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><HeartPulse className="h-4 w-4"/> Chronic Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                patient.chronicConditions.map(c => <Badge key={c} variant="outline">{c}</Badge>)
              ) : <p className="text-xs text-muted-foreground">None</p>}
            </div>
          </div>
           <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><Siren className="h-4 w-4"/> Allergies</h4>
            <div className="flex flex-wrap gap-2">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map(a => <Badge key={a} variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/20">{a}</Badge>)
              ) : <p className="text-xs text-muted-foreground">None</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DoctorDashboard({ user }: { user: User }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<CombinedPatient | null | 'not_found'>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collectionGroup(firestore, 'schedules'), where('doctorId', '==', user.healthId));
  }, [firestore, user]);
  
  const { data: chamberSchedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);


  const handleSearch = async (id?: string) => {
    const finalQuery = id || searchQuery;
    if (!finalQuery || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Search field is empty",
            description: "Please enter a Health ID or Mobile Number.",
        });
        return;
    }
    
    setIsSearching(true);
    setSearchResult(null);

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

            setSearchResult(combinedData);

            // Log the search action
            try {
                const logRef = collection(firestore, 'patients', combinedData.id, 'privacy_log');
                const logEntry = {
                    actorId: user.healthId,
                    actorName: user.name,
                    actorAvatarUrl: user.avatarUrl,
                    patientId: combinedData.id,
                    organizationId: user.organizationId,
                    action: 'search' as const,
                    timestamp: serverTimestamp(),
                };
                await addDoc(logRef, logEntry);
            } catch (logError) {
                console.error("Failed to write privacy log:", logError);
            }

        } else {
            setSearchResult('not_found');
        }

    } catch (error) {
        console.error("Patient search failed:", error);
        toast({
            variant: "destructive",
            title: "Search Failed",
            description: "An error occurred while searching for the patient.",
        });
        setSearchResult('not_found');
    }

    setIsSearching(false);
    if (id) {
        setSearchQuery(id);
    }
  }
  
  const handleQrScan = (decodedId: string) => {
    handleSearch(decodedId);
  }

  if (!user) {
      return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">Search for patients and manage your chamber schedules.</p>
      </div>

      {/* Patient Search */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
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
            
            <div className="mt-6">
              {isSearching ? (
                 <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                 </div>
              ) : searchResult === 'not_found' ? (
                 <Card className="flex flex-col items-center justify-center p-12 bg-background-soft border-dashed">
                    <UserX className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Patient Found</h3>
                    <p className="text-muted-foreground">No patient record matches the provided ID or mobile number.</p>
                </Card>
              ) : searchResult ? (
                <PatientSearchResultCard patient={searchResult} />
              ) : null}
            </div>
        </CardContent>
      </Card>
      
      {/* Chambers Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Hospital />
          Your Chambers
        </h2>
        {schedulesLoading ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-background-soft h-48 animate-pulse" />
                <Card className="bg-background-soft h-48 animate-pulse" />
            </div>
        ) : chamberSchedules && chamberSchedules.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chamberSchedules.map((schedule) => (
                    <Card key={schedule.id} className="bg-background-soft flex flex-col">
                        <CardHeader>
                            <CardTitle>{schedule.organizationName}</CardTitle>
                            <CardDescription>Room: {schedule.roomNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4"/>
                                <span>{schedule.days.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="h-4 w-4"/>
                                <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button asChild variant="outline" className="w-full">
                                <Link href={`/dashboard/appointments/${schedule.organizationId}/${schedule.id}`}>View Appointments</Link>
                           </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground">You have not been scheduled for any chambers yet.</p>
        )}
      </div>
    </div>
  );
}
