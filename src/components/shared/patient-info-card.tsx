import type { Patient, User } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Phone, ShieldCheck, HeartPulse, Siren, AlertTriangle } from "lucide-react";

type CombinedPatient = User & Partial<Patient>;

interface PatientInfoCardProps {
    patient: CombinedPatient;
    actionSlot?: React.ReactNode;
}

export function PatientInfoCard({ patient, actionSlot }: PatientInfoCardProps) {
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
          {actionSlot && <div className="self-start">{actionSlot}</div>}
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {patient.redFlag && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{patient.redFlag.title}</AlertTitle>
            <AlertDescription>
              <p>{patient.redFlag.comment}</p>
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
