
'use client'

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Stethoscope, Hospital, CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type User, type DoctorSchedule } from '@/lib/definitions';
import { BookAppointmentCalendar } from '@/components/book-appointment-calendar';
import Link from 'next/link';

function DoctorCard({ doctor, onSelect }: { doctor: User, onSelect: (doctor: User) => void }) {
    const initials = doctor.name.split(' ').map(n => n[0]).join('');
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(doctor)}>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{doctor.name}</CardTitle>
                    <CardDescription>Doctor</CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}

function DoctorDetail({ doctor, schedules }: { doctor: User, schedules: DoctorSchedule[] | null }) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                        <AvatarFallback className="text-2xl">{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{doctor.name}</CardTitle>
                        <CardDescription>Select a chamber below to book an appointment.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {schedules && schedules.length > 0 ? (
                    schedules.map(schedule => (
                        <div key={schedule.id} className="p-4 border rounded-lg bg-background-soft">
                            <h3 className="font-semibold flex items-center gap-2"><Hospital className="h-4 w-4" /> {schedule.organizationName}</h3>
                            <div className="text-sm text-muted-foreground mt-1">
                                <p>Room: {schedule.roomNumber}</p>
                                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {schedule.days.join(', ')}</p>
                                <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {schedule.startTime} - {schedule.endTime}</p>
                            </div>
                            <div className="mt-4">
                                <BookAppointmentCalendar schedule={schedule} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center">This doctor has no available schedules.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function FindDoctorPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
    const [allDoctors, setAllDoctors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const fetchDoctors = async () => {
            setIsLoading(true);
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('roles', 'array-contains', 'doctor'));
            const querySnapshot = await getDocs(q);
            const doctors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllDoctors(doctors);
            setIsLoading(false);
        };
        fetchDoctors();
    }, [firestore]);

    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedDoctor) return null;
        return query(collectionGroup(firestore, 'schedules'), where('doctorId', '==', selectedDoctor.healthId));
    }, [firestore, selectedDoctor]);

    const { data: schedules, isLoading: schedulesLoading } = useCollection<DoctorSchedule>(schedulesQuery);

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setSelectedDoctor(null);
        const results = allDoctors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10);
        setSearchResults(results);
    };

    return (
        <div className="min-h-screen bg-background-soft">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
                        <Stethoscope className="h-6 w-6" />
                        <span>Digi Health</span>
                    </Link>
                    <Button asChild>
                        <Link href="/login">Sign In / Sign Up</Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold text-center">Find Your Doctor</h1>
                    <p className="text-muted-foreground text-center mt-2">Search for a doctor and book your appointment online.</p>

                    <div className="mt-8 flex gap-2">
                        <Input 
                            placeholder="Search by doctor's name..."
                            className="text-base h-12"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            disabled={isLoading}
                        />
                        <Button size="lg" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        </Button>
                    </div>

                    <div className="mt-8">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : selectedDoctor ? (
                            <DoctorDetail doctor={selectedDoctor} schedules={schedules} />
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-4">
                                {searchResults.map(doctor => (
                                    <DoctorCard key={doctor.id} doctor={doctor} onSelect={setSelectedDoctor} />
                                ))}
                            </div>
                        ) : (
                            !isLoading && searchTerm && <p className="text-center text-muted-foreground">No doctors found matching your search.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
