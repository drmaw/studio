

import { patients } from "@/lib/data";
import type { Patient, User } from "@/lib/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, QrCode, AlertTriangle, Phone, Clock, ShieldCheck, HeartPulse, Siren } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Textarea } from "../ui/textarea";

const chamberSchedules = [
    { id: 1, hospital: 'Digital Health Clinic', room: '302', days: 'Sat, Mon, Wed', time: '5 PM - 9 PM' },
    { id: 2, hospital: 'City General Hospital', room: '501A', days: 'Sun, Tue', time: '6 PM - 10 PM' },
]

const appointmentsByChamber = {
  'Digital Health Clinic': [
    { ...patients[0], time: '5:30 PM' },
    { ...patients[1], time: '6:00 PM' },
    { ...patients[2], id: 'patient-3-clone', name: 'Rina Chowdhury', time: '6:30 PM' },
    { ...patients[0], id: 'patient-1-clone-1', name: 'Sohel Rana', time: '7:00 PM' },
    { ...patients[1], id: 'patient-2-clone-1', name: 'Ayesha Akhter', time: '7:30 PM' },
    { ...patients[0], id: 'patient-1-clone-2', name: 'Kamal Hasan', time: '8:00 PM' },
  ],
  'City General Hospital': [
    { ...patients[2], time: '6:15 PM' },
    { ...patients[0], id: 'patient-1-clone-3', name: 'Jamila Khatun', time: '6:45 PM' },
  ]
};

function PatientSearchResultCard({ patient }: { patient: Patient }) {
  const patientInitials = patient.name.split(' ').map(n => n[0]).join('');
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
         <Avatar className="h-20 w-20">
            <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${patient.id}/100/100`} />
            <AvatarFallback className="text-2xl">{patientInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{patient.name}</CardTitle>
            <CardDescription className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Health ID: {patient.id}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {patient.demographics.contact}</span>
              <span>DOB: {patient.demographics.dob}</span>
              <span>{patient.demographics.gender}</span>
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
            <AlertTitle>Red Flag</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{patient.redFlag}</p>
              <Textarea placeholder="Add a note for this alert..." defaultValue="" />
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><HeartPulse className="h-4 w-4"/> Chronic Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {patient.demographics.chronicConditions && patient.demographics.chronicConditions.length > 0 ? (
                patient.demographics.chronicConditions.map(c => <Badge key={c} variant="outline">{c}</Badge>)
              ) : <p className="text-xs text-muted-foreground">None</p>}
            </div>
          </div>
           <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><Siren className="h-4 w-4"/> Allergies</h4>
            <div className="flex flex-wrap gap-2">
              {patient.demographics.allergies && patient.demographics.allergies.length > 0 ? (
                patient.demographics.allergies.map(a => <Badge key={a} variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/20">{a}</Badge>)
              ) : <p className="text-xs text-muted-foreground">None</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DoctorDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">Here's your schedule and patient overview for today.</p>
      </div>

      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>Find a patient by their Health ID or mobile number.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter Health ID or Mobile Number..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon">
                    <QrCode className="h-5 w-5"/>
                    <span className="sr-only">Scan QR</span>
                </Button>
                <Button>Search</Button>
            </div>
            {/* Example Search Result */}
            <div className="mt-6">
              <PatientSearchResultCard patient={patients[2]} />
            </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Appointments Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CalendarDays />
          Upcoming Appointments
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(appointmentsByChamber).map(([chamber, appointments]) => {
                const schedule = chamberSchedules.find(s => s.hospital === chamber);
                return (
                <Card key={chamber}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{chamber}</span>
                            <Badge variant="secondary">{appointments.length} Patients</Badge>
                        </CardTitle>
                        {schedule && (
                            <CardDescription className="flex items-center gap-2 pt-1">
                                <Clock className="h-4 w-4"/>
                                <span>{schedule.days} &bull; {schedule.time}</span>
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.map((patient, index) => (
                                    <TableRow key={`${patient.id}-${index}`}>
                                        <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                            <AvatarImage src={`https://picsum.photos/seed/${patient.id}/32/32`} />
                                            <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <span>{patient.name}</span>
                                        </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{patient.time}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/dashboard/patients/${patient.id}`}>
                                            View <ArrowRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )})}
        </div>
      </div>
      
      {/* Chamber Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Your Chamber Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chamberSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                      <div className="font-medium">{schedule.hospital}</div>
                      <div className="text-xs text-muted-foreground">Room: {schedule.room}</div>
                  </TableCell>
                  <TableCell>
                      <div>{schedule.days}</div>
                      <div className="text-xs text-muted-foreground">{schedule.time}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
