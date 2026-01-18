
'use client';

import { useMemo, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User } from "@/lib/definitions";
import { doc } from 'firebase/firestore';
import { allRoleHierarchy } from '@/lib/roles';

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

    // Ensure that every user, regardless of their other roles, is always considered a patient.
    // This aligns with the core concept that professional roles are additive.
    const roles = Array.from(new Set([...(userProfile.roles || []), 'patient']));
    
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
    
    for (const role of allRoleHierarchy) {
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
