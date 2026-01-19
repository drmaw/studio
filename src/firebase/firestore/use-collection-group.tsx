
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import type { WithId, UseCollectionResult, InternalQuery } from './use-collection';

/**
 * React hook to subscribe to a Firestore collection group query in real-time.
 * Handles nullable queries.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted query or an infinite loop will occur.
 * use useMemoFirebase to memoize it.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} memoizedTargetQuery -
 * The Firestore CollectionGroup Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollectionGroup<T = any>(
    memoizedTargetQuery: (Query<DocumentData> & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetQuery) {
        // Do not set loading to false here, as the query might just be in the process of being created.
        // This prevents UI flicker from a "no data" state to a "loading" state.
        return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        if (error.code === 'permission-denied') {
          const path = (memoizedTargetQuery as InternalQuery)._query?.path?.canonicalString();
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: path || 'Unknown collection group',
              operation: 'list',
          }));
        } else {
            console.error("useCollectionGroup Firestore Error:", error);
        }
        setError(error);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetQuery]);

  if(memoizedTargetQuery && !(memoizedTargetQuery as any).__memo) {
    throw new Error('useCollectionGroup query was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
