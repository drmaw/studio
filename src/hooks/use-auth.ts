
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User } from "@/lib/definitions";
import { doc } from 'firebase/firestore';

export function useAuth() {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, "users", firebaseUser.uid);
  }, [firestore, firebaseUser]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const loading = isUserLoading || isProfileLoading;

  const activeRole = useMemo(() => {
    if (!userProfile) return null;
    
    // Define role hierarchy
    const roleHierarchy: Role[] = [
      'hospital_owner', 
      'doctor', 
      'nurse', 
      'manager', 
      'assistant_manager',
      'lab_technician',
      'pathologist',
      'pharmacist',
      'front_desk',
      'marketing_rep',
      'patient'
    ];

    for (const role of roleHierarchy) {
      if (userProfile.roles.includes(role)) {
        return role;
      }
    }
    return 'patient';
  }, [userProfile]);

  const user = firebaseUser && userProfile ? { ...firebaseUser, ...userProfile, id: firebaseUser.uid } : null;

  return { 
    user, 
    loading, 
    activeRole, 
    hasRole: (role: Role) => userProfile?.roles.includes(role) ?? false 
  };
}
