
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User, Membership, Organization, DetailedMembership } from "@/lib/definitions";
import { doc, getDoc, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { professionalRoleHierarchy } from "@/lib/roles";


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

        // Refined logic for setting active membership
        const savedOrgId = sessionStorage.getItem('activeOrgId');
        const personalOrgId = `org-ind-${firebaseUser.uid}`;
        
        const savedActive = detailedMemberships.find(m => m.orgId === savedOrgId);
        const personalActive = detailedMemberships.find(m => m.orgId === personalOrgId);
        const firstInList = detailedMemberships[0];

        const active = savedActive || personalActive || firstInList;
        
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
    
    // Correctly calculate AGGREGATE roles from ALL memberships
    const allRoles = memberships.flatMap(m => m.roles);
    const aggregateRoles = Array.from(new Set([...allRoles, 'patient'])) as Role[];

    return { 
      ...firebaseUser, 
      ...userProfile,
      id: firebaseUser.uid,
      roles: aggregateRoles, // Use the correct aggregate roles
      organizationId: activeMembership?.orgId, 
      organizationName: activeMembership?.orgName,
    } as User;
  }, [firebaseUser, userProfile, memberships, activeMembership]);

  const hasRole = useCallback((role: Role) => {
    // This will now correctly check against the aggregate roles
    return user?.roles?.includes(role) ?? false;
  }, [user]);
  
  const activeRole = useMemo(() => {
    // `activeRole` should be based on the ACTIVE membership's roles
    const rolesInActiveOrg = activeMembership?.roles || [];
    
    // Find the highest-ranking role in the active organization
    for (const role of professionalRoleHierarchy) {
      if (rolesInActiveOrg.includes(role)) {
        return role;
      }
    }
    // Default to patient if no professional roles in the active organization
    return 'patient';
  }, [activeMembership]);

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
