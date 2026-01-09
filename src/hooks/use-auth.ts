
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useDoc } from "@/firebase";
import type { Role, User } from "@/lib/definitions";
import { doc } from 'firebase/firestore';

export function useAuth() {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
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

  // This is the critical change. We now ensure that the user object is only considered
  // fully loaded when both firebaseUser and userProfile are present.
  // If firebaseUser exists but userProfile is still loading, we return a partial
  // user object but keep the `loading` flag as true. The layout will wait.
  const user = firebaseUser && userProfile ? { ...firebaseUser, ...userProfile, id: firebaseUser.uid } : null;

  return { 
    user: loading ? null : user, // Return null while ANY loading is in progress
    loading, 
    activeRole, 
    hasRole: (role: Role) => userProfile?.roles.includes(role) ?? false 
  };
}
