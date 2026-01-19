
'use server';

import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";

export async function createNotification(
    firestore: Firestore, 
    userId: string, 
    title: string, 
    description: string, 
    href?: string
) {
    if (!firestore || !userId) return;
    
    const notificationsRef = collection(firestore, 'users', userId, 'notifications');
    const newNotification = {
        userId,
        title,
        description,
        href: href || '#',
        isRead: false,
        createdAt: serverTimestamp(),
    };
    
    try {
        await addDoc(notificationsRef, newNotification);
    } catch(serverError) {
        // This is a server-side function, so we can't use the global error emitter.
        // We also don't want to throw an error that would crash the server function.
        // Logging to the console is the most appropriate action.
        console.error("Failed to create notification:", serverError);
    }
}
