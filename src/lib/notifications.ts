
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
    
    try {
        const notificationsRef = collection(firestore, 'users', userId, 'notifications');
        await addDoc(notificationsRef, {
            userId,
            title,
            description,
            href: href || '#',
            isRead: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}
