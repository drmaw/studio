
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import type { DutyRoster } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarClock, Briefcase, MapPin } from 'lucide-react';
import { FormattedDate } from '../shared/formatted-date';
import { Badge } from '../ui/badge';

export function MyUpcomingShifts() {
  const { user, organizationId } = useAuth();
  const firestore = useFirestore();

  const shiftsQuery = useMemoFirebase(() => {
    if (!user || !organizationId || !firestore) return null;

    const today = startOfDay(new Date());
    const sevenDaysFromNow = endOfDay(addDays(today, 6));

    return query(
      collection(firestore, 'organizations', organizationId, 'rosters'),
      where('userId', '==', user.id),
      where('date', '>=', format(today, 'yyyy-MM-dd')),
      where('date', '<=', format(sevenDaysFromNow, 'yyyy-MM-dd')),
      orderBy('date', 'asc')
    );
  }, [user, organizationId, firestore]);

  const { data: shifts, isLoading } = useCollection<DutyRoster>(shiftsQuery);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> My Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }

  if (!shifts || shifts.length === 0) {
    return null; // Don't render the card if there are no upcoming shifts
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> My Upcoming Shifts (Next 7 Days)</CardTitle>
        <CardDescription>Your assigned duties for the week ahead.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shifts.map(shift => (
          <div key={shift.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-background-soft gap-2">
            <div>
              <p className="font-bold text-lg"><FormattedDate date={shift.date} formatString="eeee, dd MMM" /></p>
              <p className="text-sm text-muted-foreground"><FormattedDate date={shift.date} formatString="yyyy" /></p>
            </div>
            <div className="flex items-center gap-4">
                <Badge className="text-base py-1 px-3 w-24 justify-center">{shift.shiftType}</Badge>
                <div className="text-sm text-right">
                    <p className="font-semibold flex items-center gap-1.5 justify-end"><Briefcase className="h-4 w-4" /> {shift.dutyArea}</p>
                </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
