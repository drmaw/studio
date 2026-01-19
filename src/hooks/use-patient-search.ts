
'use client';

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, where, limit, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, addDocument } from "@/firebase";
import type { User, Patient } from '@/lib/definitions';

type CombinedPatient = User & Partial<Patient>;

export function usePatientSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<CombinedPatient | null | 'not_found'>(null);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();

    const handleSearch = async (id?: string) => {
        const finalQuery = id || searchQuery;
        if (!finalQuery || !currentUser || !firestore) {
            toast({
                variant: "destructive",
                title: "Search field is empty",
                description: "Please enter a Patient Health ID or Mobile Number.",
            });
            return;
        }
        
        setIsSearching(true);
        setSearchResult(null);

        try {
            const usersRef = collection(firestore, "users");
            const isHealthId = /^\d{10}$/.test(finalQuery); 
            
            const q = isHealthId 
                ? query(usersRef, where("healthId", "==", finalQuery), limit(1))
                : query(usersRef, where("demographics.mobileNumber", "==", finalQuery), limit(1));

            const querySnapshot = await getDocs(q);
            let foundPatient: CombinedPatient | null = null;
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const patientUser = { id: userDoc.id, ...userDoc.data() } as User;
                
                const patientDocRef = doc(firestore, "patients", patientUser.id);
                const patientDocSnap = await getDoc(patientDocRef);
                const patientData = patientDocSnap.exists() ? patientDocSnap.data() as Patient : null;

                foundPatient = {
                    ...patientUser,
                    ...patientData,
                    id: patientUser.id,
                };
            }
            
            setSearchResult(foundPatient ?? 'not_found');

            if (foundPatient) {
                const validSearcherRoles = ['doctor', 'hospital_owner', 'manager'];
                if (currentUser.roles.some(role => validSearcherRoles.includes(role))) {
                    const logRef = collection(firestore, 'patients', foundPatient.id, 'privacy_log');
                    addDocument(logRef, {
                        actorId: currentUser.healthId,
                        actorName: currentUser.name,
                        actorAvatarUrl: currentUser.avatarUrl,
                        patientId: foundPatient.id,
                        organizationId: currentUser.organizationId,
                        action: 'search' as const,
                        timestamp: serverTimestamp(),
                    });
                }
            }

        } catch (error) {
            console.error("Patient search failed:", error);
            toast({
                variant: "destructive",
                title: "Search Failed",
                description: "An error occurred while searching for the patient.",
            });
            setSearchResult('not_found');
        }

        setIsSearching(false);
        if (id) {
            setSearchQuery(id);
        }
    };
    
    return {
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResult,
        handleSearch,
        setSearchResult
    };
}
