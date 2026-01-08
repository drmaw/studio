
'use client';

import { searchLogs, viewLogs, addLogs } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Search, Eye, FilePlus } from "lucide-react";
import { format } from "date-fns";
import type { PrivacyLogEntry } from "@/lib/definitions";

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
                <p>{format(new Date(log.timestamp), "dd MMM yyyy")}</p>
                <p>{format(new Date(log.timestamp), "hh:mm a")}</p>
            </div>
        </div>
    )
}

function LogCategory({ title, icon, logs, className }: { title: string, icon: React.ReactNode, logs: PrivacyLogEntry[], className?: string }) {
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
                {logs.length > 0 ? (
                    <ScrollArea className="h-72 border rounded-md">
                        <div className="p-2">
                            {logs.map(log => (
                                <LogEntry key={log.id} log={log} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground border rounded-md">
                        <p>No activity recorded.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function PrivacyLogPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <History className="h-8 w-8" />
                    Privacy Log
                </h1>
                <p className="text-muted-foreground">
                    An audit trail of all activity related to your health records.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <LogCategory title="Profile Searches" icon={<Search className="h-5 w-5 text-primary"/>} logs={searchLogs} className="bg-secondary/50"/>
                <LogCategory title="Record Views" icon={<Eye className="h-5 w-5 text-primary"/>} logs={viewLogs} className="bg-accent/30" />
                <LogCategory title="Record Additions" icon={<FilePlus className="h-5 w-5 text-primary"/>} logs={addLogs} className="bg-secondary/50" />
            </div>
        </div>
    )
}

    