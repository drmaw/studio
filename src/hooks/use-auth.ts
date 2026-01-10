
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

  // The 'loading' state is now primarily tied to the initial Firebase Authentication check.
  const loading = isAuthLoading;

  const user = useMemo(() => {
    // If auth is loading, there is no user yet.
    if (isAuthLoading || !firebaseUser) {
      return null;
    }
    
    // As soon as Firebase Auth has a user, create a base user object.
    const baseUser = { ...firebaseUser, id: firebaseUser.uid };

    // If the profile from Firestore has loaded, merge it.
    // Otherwise, the dashboard will gracefully handle the partial user object.
    if (userProfile) {
      return { ...baseUser, ...userProfile };
    }

    // Return the user from auth even if the profile is not yet available.
    return baseUser as User;
  }, [isAuthLoading, firebaseUser, userProfile]);

  const activeRole = useMemo(() => {
    if (!userProfile) return 'patient'; // Default to 'patient' if profile is not loaded
    
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
    hasRole: (role: Role) => userProfile?.roles.includes(role) ?? false 
  };
}
