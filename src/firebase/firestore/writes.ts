
import { 
    doc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch as createWriteBatch, 
    type Firestore, 
    type DocumentData, 
    type DocumentReference, 
    type SetOptions,
    type CollectionReference,
    type UpdateData,
    type WithFieldValue,
    type WriteBatch
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';


export function addDocument<T>(
    ref: CollectionReference<T>, 
    data: WithFieldValue<T>,
    onSuccess?: (docRef: DocumentReference<T>) => void,
    onError?: (error: Error) => void
) {
    addDoc(ref, data)
        .then(docRef => {
            if (onSuccess) onSuccess(docRef);
        })
        .catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: ref.path,
                operation: 'create',
                requestResourceData: data,
            }));
            if (onError) onError(serverError);
        });
}


export function setDocument<T>(
    ref: DocumentReference<T>, 
    data: WithFieldValue<T>, 
    options: SetOptions,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) {
    setDoc(ref, data, options)
        .then(() => {
            if (onSuccess) onSuccess();
        })
        .catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: ref.path,
                operation: options && 'merge' in options ? 'update' : 'create',
                requestResourceData: data,
            }));
            if (onError) onError(serverError);
        });
}


export function updateDocument<T = DocumentData>(
    ref: DocumentReference<T>, 
    data: UpdateData<T>,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) {
    updateDoc(ref, data)
        .then(() => {
            if (onSuccess) onSuccess();
        })
        .catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: ref.path,
                operation: 'update',
                requestResourceData: data,
            }));
            if (onError) onError(serverError);
        });
}


export function deleteDocument(
    ref: DocumentReference<any>,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) {
    deleteDoc(ref)
        .then(() => {
            if (onSuccess) onSuccess();
        })
        .catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: ref.path,
                operation: 'delete',
            }));
            if (onError) onError(serverError);
        });
}


export function commitBatch(
    batch: WriteBatch, 
    operationDescription: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) {
    batch.commit()
        .then(() => {
            if (onSuccess) onSuccess();
        })
        .catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `batch operation: ${operationDescription}`,
                operation: 'write',
            }));
            if (onError) onError(serverError);
        });
}

// Re-export writeBatch from firestore so components don't need to import it separately
export { createWriteBatch as writeBatch };
