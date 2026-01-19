
'use server';

import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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
    
    addDoc(notificationsRef, newNotification)
        .catch(async (serverError) => {
            console.error("Failed to create notification:", serverError);
            // We can't use the standard error emitter here as this is a server-side function.
            // Logging to console is the best we can do.
        });
}
