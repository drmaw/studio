'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It used to throw errors to be caught by Next.js's global-error.tsx, but has been
 * disabled to prevent app-wide crashes on contained data-fetching issues.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger a re-render.
      // In the future, this could be used to show a non-intrusive toast or banner.
      console.error("A Firestore permission error was caught globally:", error.message);
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // The error is no longer re-thrown here.
  // This prevents a single component's permission error from crashing the entire application.
  // The component responsible for the query will now handle its own loading/error/empty state.
  if (error) {
    // A non-crashing UI element could be returned here, e.g., a global error banner.
  }

  // This component renders nothing.
  return null;
}
