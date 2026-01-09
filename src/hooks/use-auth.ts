
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User } from "@/lib/definitions";
import { doc } from 'firebase/firestore';

export function useAuth() {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, "users", firebaseUser.uid);
  }, [firestore, firebaseUser]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const loading = useMemo(() => {
    // We are loading if the initial auth check is happening OR if we have an auth'd user but are still fetching their profile.
    return isAuthLoading || (!!firebaseUser && isProfileLoading);
  }, [isAuthLoading, isProfileLoading, firebaseUser]);


  const user = useMemo(() => {
    // Only return a complete user object if we are NOT loading and we have both auth and profile data.
    if (loading || !firebaseUser || !userProfile) {
      return null;
    }
    return { ...firebaseUser, ...userProfile, id: firebaseUser.uid };
  }, [loading, firebaseUser, userProfile]);

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

  return { 
    user,
    loading, 
    activeRole, 
    hasRole: (role: Role) => userProfile?.roles.includes(role) ?? false 
  };
}
