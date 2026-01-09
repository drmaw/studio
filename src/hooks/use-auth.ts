
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

  const loading = useMemo(() => {
    // We are loading if the initial auth check is happening.
    if (isUserLoading) return true;
    // If auth check is done but there's no Firebase user, we are not loading.
    if (!firebaseUser) return false;
    // If there is a Firebase user but we are still waiting for their profile, we are loading.
    if (isProfileLoading) return true;
    // If we have a firebase user but no profile (and not loading), then they don't have a profile. Not loading.
    if (firebaseUser && !userProfile) return false;
    // If all checks pass, we are not loading.
    return false;
  }, [isUserLoading, isProfileLoading, firebaseUser, userProfile]);

  const activeRole = useMemo(() => {
    if (!userProfile) return null;
    
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
