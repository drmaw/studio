'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Throw the error to be caught by Next.js's development overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, you might want to log this to a service
        console.error(error);
      }
    };

    errorEmitter.on('permission-error', handleError);

    // This is a global listener, so we don't return a cleanup function
    // to prevent it from being removed on component unmounts during navigation.
  }, []);

  return null; // This component does not render anything
}
