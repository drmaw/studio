
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Search, Eye, FilePlus, Loader2 } from "lucide-react";
import type { PrivacyLogEntry } from "@/lib/definitions";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { FormattedDate } from "@/components/shared/formatted-date";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

function LogEntry({ log }: { log: PrivacyLogEntry }) {
    const actorInitials = log.actorName.split(' ').map(n => n[0]).join('');

    return (
        <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-md">
            <Avatar>
                <AvatarImage src={log.actorAvatarUrl} alt={log.actorName} />
                <AvatarFallback>{actorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{log.actorName}</p>
                <p className="text-xs text-muted-foreground">Health ID: {log.actorId}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
                <p><FormattedDate date={log.timestamp} formatString="dd-MM-yyyy" fallback="N/A" /></p>
                <p><FormattedDate date={log.timestamp} formatString="hh:mm a" fallback="" /></p>
            </div>
        </div>
    )
}

function LogCategory({ title, icon, logs, isLoading, className }: { title: string, icon: React.ReactNode, logs: PrivacyLogEntry[], isLoading: boolean, className?: string }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>
                    A log of all users who have performed this action.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-72 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : logs.length > 0 ? (
                    <ScrollArea className="h-72 border rounded-md">
                        <div className="p-2">
                            {logs.map(log => (
                                <LogEntry key={log.id} log={log} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <EmptyState 
                        icon={History}
                        message="No Activity"
                        description="No activity has been recorded for this action yet."
                        className="h-72 justify-center flex flex-col"
                    />
                )}
            </CardContent>
        </Card>
    )
}

export default function PrivacyLogPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const baseQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'patients', user.id, 'privacy_log');
    }, [user, firestore]);

    const searchLogsQuery = useMemoFirebase(() => {
        if (!baseQuery) return null;
        return query(baseQuery, where('action', '==', 'search'), orderBy('timestamp', 'desc'));
    }, [baseQuery]);

    const viewLogsQuery = useMemoFirebase(() => {
        if (!baseQuery) return null;
        return query(baseQuery, where('action', '==', 'view_record'), orderBy('timestamp', 'desc'));
    }, [baseQuery]);
    
    const addLogsQuery = useMemoFirebase(() => {
        if (!baseQuery) return null;
        return query(baseQuery, where('action', '==', 'add_record'), orderBy('timestamp', 'desc'));
    }, [baseQuery]);

    const { data: searchLogs, isLoading: searchLoading } = useCollection<PrivacyLogEntry>(searchLogsQuery);
    const { data: viewLogs, isLoading: viewLoading } = useCollection<PrivacyLogEntry>(viewLogsQuery);
    const { data: addLogs, isLoading: addLoading } = useCollection<PrivacyLogEntry>(addLogsQuery);

    return (
        <div className="space-y-6">
            <PageHeader 
                title={<><History className="h-8 w-8" />Privacy Log</>}
                description="An audit trail of all activity related to your health records."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <LogCategory title="Profile Searches" icon={<Search className="h-5 w-5 text-primary"/>} logs={searchLogs || []} isLoading={searchLoading} className="bg-card"/>
                <LogCategory title="Record Views" icon={<Eye className="h-5 w-5 text-primary"/>} logs={viewLogs || []} isLoading={viewLoading} className="bg-background-soft" />
                <LogCategory title="Record Additions" icon={<FilePlus className="h-5 w-5 text-primary"/>} logs={addLogs || []} isLoading={addLoading} className="bg-background-softer" />
            </div>
        </div>
    )
}
