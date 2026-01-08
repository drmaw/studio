

import type { MedicalRecord, Role } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Calendar, FileText, Stethoscope } from "lucide-react";
import { EditNoteDialog } from "./edit-note-dialog";

type MedicalRecordCardProps = {
  record: MedicalRecord;
  currentUserRole: Role;
};

export function MedicalRecordCard({ record, currentUserRole }: MedicalRecordCardProps) {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {record.diagnosis}
                </CardTitle>
                <CardDescription className="pt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {record.date}</span>
                    <span className="flex items-center gap-1.5"><Stethoscope className="h-4 w-4" /> by {record.doctorName}</span>
                </CardDescription>
            </div>
            {currentUserRole === 'doctor' && <EditNoteDialog record={record} />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90">{record.notes}</p>
      </CardContent>
    </Card>
  );
}
