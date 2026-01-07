'use client';

import { useState, useEffect } from 'react';
import { users } from '@/lib/data';
import type { User } from '@/lib/definitions';

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

  return { user, loading };
}
