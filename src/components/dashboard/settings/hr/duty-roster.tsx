
'use client';

import { useState } from 'react';
import { startOfWeek, endOfWeek, addDays, format, eachDayOfInterval } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { DutyRoster, User } from '@/lib/definitions';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AssignShiftDialog } from './assign-shift-dialog';

import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface DutyRosterProps {
  staff: User[];
}

export function DutyRoster({ staff }: DutyRosterProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<{ staffMember: User; date: Date; existingShift: DutyRoster | null } | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const { organizationId } = useAuth();
  const firestore = useFirestore();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }); // Saturday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 6 }); // Friday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(
      collection(firestore, 'organizations', organizationId, 'rosters'),
      where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
      where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
    );
  }, [firestore, organizationId, weekStart, weekEnd]);

  const { data: shifts, isLoading, forceRefetch } = useCollection<DutyRoster>(shiftsQuery);

  const shiftsByStaffAndDate = useMemo(() => {
    const map = new Map<string, DutyRoster>();
    if (!shifts) return map;
    shifts.forEach(shift => {
      const key = `${shift.userId}_${shift.date}`;
      map.set(key, shift);
    });
    return map;
  }, [shifts]);

  const handleDateChange = (amount: number) => {
    setCurrentDate(prev => addDays(prev, amount));
  };

  const handleCellClick = (staffMember: User, date: Date) => {
    const key = `${staffMember.id}_${format(date, 'yyyy-MM-dd')}`;
    const existingShift = shiftsByStaffAndDate.get(key) || null;
    setSelectedShift({ staffMember, date, existingShift });
    setIsAssignDialogOpen(true);
  };

  return (
    <>
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Users />
          Duty Roster
        </h3>
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => handleDateChange(-7)}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous Week
          </Button>
          <h4 className="text-center font-semibold">
            {format(weekStart, 'dd MMM')} - {format(weekEnd, 'dd MMM, yyyy')}
          </h4>
          <Button variant="outline" onClick={() => handleDateChange(7)}>
            Next Week <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-secondary z-10">Staff</TableHead>
                {weekDays.map(day => (
                  <TableHead key={day.toString()} className="text-center">
                    {format(day, 'EEE')} <br/> {format(day, 'dd')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map(staffMember => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{staffMember.name}</TableCell>
                  {weekDays.map(day => {
                    const key = `${staffMember.id}_${format(day, 'yyyy-MM-dd')}`;
                    const shift = shiftsByStaffAndDate.get(key);
                    return (
                      <TableCell
                        key={day.toString()}
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCellClick(staffMember, day)}
                      >
                        {shift && (
                          <div className="flex flex-col items-center">
                            <Badge variant={
                                shift.shiftType === 'Morning' ? 'default' :
                                shift.shiftType === 'Evening' ? 'secondary' :
                                'destructive'
                            }>{shift.shiftType}</Badge>
                            <span className="text-xs text-muted-foreground mt-1">{shift.dutyArea}</span>
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {selectedShift && organizationId && (
        <AssignShiftDialog
            isOpen={isAssignDialogOpen}
            setIsOpen={setIsAssignDialogOpen}
            staffMember={selectedShift.staffMember}
            date={selectedShift.date}
            orgId={organizationId}
            existingShift={selectedShift.existingShift}
            onShiftAssigned={() => {
                if(forceRefetch) forceRefetch();
            }}
        />
      )}
    </>
  );
}
