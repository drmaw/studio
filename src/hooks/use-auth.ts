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
    // The "active" role is the first non-patient role, or 'patient' if that's all they are.
    return userProfile.roles.find(r => r !== 'patient') || 'patient';
  }, [userProfile]);

  const user = firebaseUser && userProfile ? { ...firebaseUser, ...userProfile } : null;

  return { 
    user, 
    loading, 
    activeRole, 
    hasRole: (role: Role) => userProfile?.roles.includes(role) ?? false 
  };
}
