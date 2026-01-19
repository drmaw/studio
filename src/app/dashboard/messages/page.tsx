'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useCollectionGroup, useCollection, addDocument, updateDocument, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import type { Conversation, Message, User } from '@/lib/definitions';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { FormattedDate } from '@/components/shared/formatted-date';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Send, Search } from 'lucide-react';

// Main Component
export default function MessagesPage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    const conversationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collectionGroup(firestore, 'conversations'),
            where('participants', 'array-contains', user.id),
            orderBy('updatedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: conversations, isLoading: conversationsLoading } = useCollectionGroup<Conversation>(conversationsQuery);
    
    // Set the first conversation as selected by default
    useEffect(() => {
        if (!selectedConversation && conversations && conversations.length > 0) {
            setSelectedConversation(conversations[0]);
        }
    }, [conversations, selectedConversation]);

    return (
        <div className="h-[calc(100vh_-_theme(space.14)_-_2*theme(space.6))] flex flex-col">
            <PageHeader
                title="Secure Messaging"
                description="Communicate directly with your doctors and patients."
            />
            <Card className="mt-4 flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
                <ConversationList
                    conversations={conversations || []}
                    isLoading={conversationsLoading}
                    currentUser={user}
                    selectedConversation={selectedConversation}
                    onSelect={setSelectedConversation}
                />
                <ChatWindow
                    conversation={selectedConversation}
                    currentUser={user}
                />
            </Card>
        </div>
    );
}

// Conversation List Component
function ConversationList({ conversations, isLoading, currentUser, selectedConversation, onSelect }: { conversations: Conversation[], isLoading: boolean, currentUser: User | null, selectedConversation: Conversation | null, onSelect: (conv: Conversation) => void }) {
    if (!currentUser) return null;
    return (
        <div className="col-span-1 border-r flex flex-col">
            <div className="p-4 border-b">
                <div className="relative">
                    <Input placeholder="Search conversations..." className="pl-8" />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                ) : conversations.length > 0 ? (
                    conversations.map(conv => {
                        const otherParticipantName = conv.participantNames.find(name => name !== currentUser.name) || 'Unknown';
                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                                    selectedConversation?.id === conv.id && "bg-accent"
                                )}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{otherParticipantName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold truncate">{otherParticipantName}</p>
                                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage?.text}</p>
                                </div>
                                <p className="text-xs text-muted-foreground self-start">
                                    {conv.lastMessage?.timestamp && <FormattedDate date={conv.lastMessage.timestamp} formatString="p" />}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</div>
                )}
            </ScrollArea>
        </div>
    );
}

// Chat Window Component
function ChatWindow({ conversation, currentUser }: { conversation: Conversation | null, currentUser: User | null }) {
    const firestore = useFirestore();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !conversation) return null;
        return query(
            collection(firestore, 'organizations', conversation.organizationId, 'conversations', conversation.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, conversation]);

    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
    
    // Auto-scroll to bottom
    useEffect(() => {
        setTimeout(() => {
             if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }, [messages]);

    const handleSendMessage = (text: string) => {
        if (!firestore || !currentUser || !conversation) return;
        
        const messagesRef = collection(firestore, 'organizations', conversation.organizationId, 'conversations', conversation.id, 'messages');
        const conversationRef = doc(firestore, 'organizations', conversation.organizationId, 'conversations', conversation.id);
        
        const newMessage = {
            conversationId: conversation.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text,
            createdAt: serverTimestamp(),
        };

        addDocument(messagesRef, newMessage, () => {
             updateDocument(conversationRef, {
                lastMessage: {
                    text,
                    senderId: currentUser.id,
                    timestamp: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });
        });
    };

    if (!conversation || !currentUser) {
        return (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <EmptyState icon={MessageSquare} message="Select a conversation" description="Choose a conversation from the list to start messaging." />
            </div>
        );
    }
    
    const otherParticipantName = conversation.participantNames.find(name => name !== currentUser.name) || 'Unknown';

    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            <div className="p-4 border-b flex items-center gap-4">
                 <Avatar className="h-10 w-10">
                    <AvatarFallback>{otherParticipantName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold">{otherParticipantName}</h3>
                    <p className="text-xs text-muted-foreground">In organization: {conversation.organizationName}</p>
                </div>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                 {messagesLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                 ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.senderId === currentUser.id} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center text-sm text-muted-foreground pt-8">No messages in this conversation yet.</div>
                 )}
            </ScrollArea>
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
}

// Message Bubble Component
function MessageBubble({ message, isCurrentUser }: { message: Message, isCurrentUser: boolean }) {
    return (
        <div className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
             {!isCurrentUser && <Avatar className="h-6 w-6"><AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback></Avatar>}
            <div className={cn(
                "max-w-xs md:max-w-md p-3 rounded-lg",
                isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p className="text-sm">{message.text}</p>
            </div>
             {isCurrentUser && <Avatar className="h-6 w-6"><AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback></Avatar>}
        </div>
    );
}

// Message Input Component
function MessageInput({ onSend }: { onSend: (text: string) => void }) {
    const [text, setText] = useState('');
    
    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText('');
        }
    };
    
    return (
        <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
                <Input
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={!text.trim()}>
                    <Send />
                </Button>
            </div>
        </div>
    );
}
