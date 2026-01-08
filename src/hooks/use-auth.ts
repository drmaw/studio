'use client';

import { useState, useEffect, useMemo } from 'react';
import { users } from '@/lib/data';
import type { Role, User } from '@/lib/definitions';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('digi-health-user-id');
    if (userId) {
      const foundUser = users.find(u => u.id === userId);
      setUser(foundUser || null);
    }
    setLoading(false);
  }, []);

  const activeRole = useMemo(() => {
    if (!user) return null;
    // The "active" role is the first non-patient role, or 'patient' if that's all they are.
    return user.roles.find(r => r !== 'patient') || 'patient';
  }, [user]);

  return { user, loading, activeRole, hasRole: (role: Role) => user?.roles.includes(role) ?? false };
}
