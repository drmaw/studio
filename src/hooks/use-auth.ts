
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Role, User, Membership, Organization, DetailedMembership } from "@/lib/definitions";
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
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

  // 2. Fetch all of the user's memberships from the 'members' collection group
  useEffect(() => {
    if (!firestore || !firebaseUser?.uid) {
      setIsMembershipsLoading(false);
      return;
    };

    setIsMembershipsLoading(true);

    const fetchMemberships = async () => {
      try {
        const membersQuery = query(collectionGroup(firestore, 'members'), where('userId', '==', firebaseUser.uid));
        const membersSnapshot = await getDocs(membersQuery);
        
        const memberDocs = membersSnapshot.docs.map(d => ({
          ...d.data() as Membership,
          orgId: d.ref.parent.parent!.id,
          id: d.id,
        }));

        const orgPromises = memberDocs.map(m => getDoc(doc(firestore, 'organizations', m.orgId)));
        const orgSnapshots = await Promise.all(orgPromises);
        
        const detailedMemberships = memberDocs.map((member, index) => {
          const orgData = orgSnapshots[index].data() as Organization;
          return { ...member, orgName: orgData.name };
        });

        setMemberships(detailedMemberships);

        // 3. Determine and set the active membership
        const savedOrgId = sessionStorage.getItem('activeOrgId');
        const active = detailedMemberships.find(m => m.orgId === savedOrgId) || detailedMemberships[0];
        
        if (active) {
            setActiveMembership(active);
            sessionStorage.setItem('activeOrgId', active.orgId);
        } else {
             setActiveMembership(null);
        }

      } catch (error) {
        console.error("Failed to fetch user memberships:", error);
      } finally {
        setIsMembershipsLoading(false);
      }
    };

    fetchMemberships();

  }, [firestore, firebaseUser]);
  
  const switchOrganization = useCallback((organizationId: string) => {
    const newActiveMembership = memberships.find(m => m.orgId === organizationId);
    if (newActiveMembership) {
        setActiveMembership(newActiveMembership);
        sessionStorage.setItem('activeOrgId', newActiveMembership.orgId);
    }
  }, [memberships]);


  const isCombinedLoading = isAuthLoading || isProfileLoading || isMembershipsLoading;

  // 4. Memoize the final user object, enriching it with data from the active membership
  const user = useMemo(() => {
    if (!firebaseUser || !userProfile) return null;
    
    // The user's roles are now defined by their currently active membership
    const activeRoles = activeMembership?.roles || [];
    const roles = Array.from(new Set([...activeRoles, 'patient']));

    return { 
      ...firebaseUser, 
      ...userProfile,
      id: firebaseUser.uid,
      roles: roles,
      organizationId: activeMembership?.orgId, // This now dynamically reflects the active organization
      organizationName: activeMembership?.orgName,
    } as User;
  }, [firebaseUser, userProfile, activeMembership]);

  const hasRole = useCallback((role: Role) => {
    return user?.roles?.includes(role) ?? false;
  }, [user]);
  
  const activeRole = useMemo(() => {
    if (!user?.roles) return 'patient';
    
    // Find the highest-ranking role the user has within their active membership
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
