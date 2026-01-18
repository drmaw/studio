
'use client';

import { useMemo, useCallback } from 'react';
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

  const isCombinedLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);

  const user = useMemo(() => {
    if (!firebaseUser || !userProfile) return null;

    // Ensure roles is always an array, defaulting to ['patient'] if not present or empty.
    // This makes the app more resilient to inconsistent data in Firestore.
    const roles = (userProfile.roles && userProfile.roles.length > 0) ? userProfile.roles : ['patient'];
    
    let displayName = userProfile.name;
    if (roles.includes('doctor') && !displayName.startsWith('Dr.')) {
        displayName = `Dr. ${displayName}`;
    }

    // Combine the base user from Auth with the profile from Firestore
    return { 
      ...firebaseUser, 
      ...userProfile,
      roles,
      name: displayName,
      id: firebaseUser.uid 
    } as User;
  }, [firebaseUser, userProfile]);

  const hasRole = useCallback((role: Role) => {
    return user?.roles?.includes(role) ?? false;
  }, [user]);
  
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
    loading: isCombinedLoading, 
    isAuthLoading,
    isProfileLoading,
    activeRole, 
    hasRole
  };
}
