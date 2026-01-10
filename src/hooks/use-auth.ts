
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
    if (!firebaseUser) return null;
    
    // Combine the base user from Auth with the profile from Firestore
    return { 
      ...firebaseUser, 
      ...(userProfile || {}),
      id: firebaseUser.uid 
    } as User;
  }, [firebaseUser, userProfile]);

  const activeRole = useMemo(() => {
    if (!user?.roles) return 'patient'; 
    
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
      if (user.roles.includes(role)) {
        return role;
      }
    }
    return 'patient';
  }, [user?.roles]);

  return { 
    user,
    loading, 
    activeRole, 
    hasRole: (role: Role) => user?.roles?.includes(role) ?? false 
  };
}

    