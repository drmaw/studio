
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User } from "@/lib/definitions";
import { doc } from 'firebase/firestore';

export function useAuth() {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser?.uid) return null;
    return doc(firestore, "users", firebaseUser.uid);
  }, [firestore, firebaseUser?.uid]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const loading = isAuthLoading || (!!firebaseUser && isProfileLoading);

  const user = useMemo(() => {
    if (isAuthLoading || !firebaseUser) {
      return null;
    }
    
    const baseUser = { ...firebaseUser, id: firebaseUser.uid };

    if (userProfile) {
      return { ...baseUser, ...userProfile };
    }

    return baseUser as User;
  }, [isAuthLoading, firebaseUser, userProfile]);

  const activeRole = useMemo(() => {
    if (!userProfile?.roles) return 'patient'; 
    
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

  return { 
    user,
    loading, 
    activeRole, 
    hasRole: (role: Role) => userProfile?.roles?.includes(role) ?? false 
  };
}
