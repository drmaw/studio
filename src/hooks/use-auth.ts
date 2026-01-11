
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

  // The main loading state now only depends on the profile if we know we have an auth user
  const isCombinedLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);

  const user = useMemo(() => {
    if (!firebaseUser || !userProfile) return null;
    
    let displayName = userProfile.name;
    if (userProfile.roles.includes('doctor') && !displayName.startsWith('Dr.')) {
        displayName = `Dr. ${displayName}`;
    }

    // Combine the base user from Auth with the profile from Firestore
    return { 
      ...firebaseUser, 
      ...userProfile,
      name: displayName,
      id: firebaseUser.uid 
    } as User;
  }, [firebaseUser, userProfile]);

  const hasRole = (role: Role) => user?.roles?.includes(role) ?? false;
  
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
    // The combined loading state for when you need the full user object
    loading: isCombinedLoading, 
    // The specific loading state for just the Firebase Auth check
    isAuthLoading,
    // The specific loading state for the Firestore profile fetch
    isProfileLoading,
    activeRole, 
    hasRole
  };
}
