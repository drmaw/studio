
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User, Membership, Organization, DetailedMembership } from "@/lib/definitions";
import { doc, getDoc, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { allRoleHierarchy } from '@/lib/roles';


export function useAuth() {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const [memberships, setMemberships] = useState<DetailedMembership[]>([]);
  const [activeMembership, setActiveMembership] = useState<DetailedMembership | null>(null);
  const [isMembershipsLoading, setIsMembershipsLoading] = useState(true);

  // 1. Fetch the user's base profile from /users/{userId}
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser?.uid) return null;
    return doc(firestore, "users", firebaseUser.uid);
  }, [firestore, firebaseUser?.uid]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  // 2. Fetch all of the user's memberships in real-time
  useEffect(() => {
    if (!firestore || !firebaseUser?.uid) {
      setIsMembershipsLoading(false);
      return;
    };

    setIsMembershipsLoading(true);

    const membersQuery = query(collectionGroup(firestore, 'members'), where('userId', '==', firebaseUser.uid));
    
    const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
      try {
        const memberDocs = membersSnapshot.docs.map(d => ({
            ...d.data() as Membership,
            orgId: d.ref.parent.parent!.id,
            id: d.id,
        }));

        if (memberDocs.length === 0) {
            setMemberships([]);
            setActiveMembership(null);
            setIsMembershipsLoading(false);
            return;
        }

        const orgIds = [...new Set(memberDocs.map(m => m.orgId))];
        const orgPromises = orgIds.map(id => getDoc(doc(firestore, 'organizations', id)));
        const orgSnapshots = await Promise.all(orgPromises);
        
        const orgsDataMap = new Map<string, Organization>();
        orgSnapshots.forEach(snap => {
            if (snap.exists()) {
                orgsDataMap.set(snap.id, snap.data() as Organization);
            }
        });
        
        const detailedMemberships = memberDocs.map((member) => {
            const orgData = orgsDataMap.get(member.orgId);
            return { ...member, orgName: orgData?.name || 'Unknown Organization' };
        });

        setMemberships(detailedMemberships);

        const savedOrgId = sessionStorage.getItem('activeOrgId');
        const active = detailedMemberships.find(m => m.orgId === savedOrgId) || detailedMemberships[0];
        
        if (active) {
            setActiveMembership(active);
            if (active.orgId !== savedOrgId) {
                sessionStorage.setItem('activeOrgId', active.orgId);
            }
        } else {
             setActiveMembership(null);
             sessionStorage.removeItem('activeOrgId');
        }

      } catch (error) {
        console.error("Failed to process user memberships:", error);
      } finally {
        setIsMembershipsLoading(false);
      }
    }, (error) => {
        console.error("Failed to listen for membership changes:", error);
        setIsMembershipsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, firebaseUser?.uid]);
  
  const switchOrganization = useCallback((organizationId: string) => {
    const newActiveMembership = memberships.find(m => m.orgId === organizationId);
    if (newActiveMembership) {
        setActiveMembership(newActiveMembership);
        sessionStorage.setItem('activeOrgId', newActiveMembership.orgId);
    }
  }, [memberships]);


  const isCombinedLoading = isAuthLoading || isProfileLoading || isMembershipsLoading;

  const user = useMemo(() => {
    if (!firebaseUser || !userProfile) return null;
    
    const activeRoles = activeMembership?.roles || [];
    const roles = Array.from(new Set([...activeRoles, 'patient']));

    return { 
      ...firebaseUser, 
      ...userProfile,
      id: firebaseUser.uid,
      roles: roles,
      organizationId: activeMembership?.orgId, 
      organizationName: activeMembership?.orgName,
    } as User;
  }, [firebaseUser, userProfile, activeMembership]);

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
    memberships,
    activeMembership,
    switchOrganization,
    hasRole,
    activeRole
  };
}
