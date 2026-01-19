
import { 
    doc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch, 
    type Firestore, 
    type DocumentData, 
    type DocumentReference, 
    type SetOptions,
    type CollectionReference,
    type UpdateData,
    type WithFieldValue
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * Safely adds a document to a collection, handling permissions errors.
 * @param ref The CollectionReference to add the document to.
 * @param data The data for the new document.
 * @returns The DocumentReference of the newly created document, or null if an error occurred.
 */
export async function addDocument<T>(ref: CollectionReference<T>, data: WithFieldValue<T>): Promise<DocumentReference<T> | null> {
    try {
        return await addDoc(ref, data);
    } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'create',
            requestResourceData: data,
        }));
        return null;
    }
}

/**
 * Safely sets data to a document, handling permissions errors.
 * @param ref The DocumentReference to set data to.
 * @param data The data to set.
 * @param options Options for the set operation.
 * @returns A boolean indicating success (true) or failure (false).
 */
export async function setDocument<T>(ref: DocumentReference<T>, data: WithFieldValue<T>, options?: SetOptions): Promise<boolean> {
    try {
        await setDoc(ref, data, options || {});
        return true;
    } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: options && 'merge' in options ? 'update' : 'create',
            requestResourceData: data,
        }));
        return false;
    }
}

/**
 * Safely updates a document, handling permissions errors.
 * @param ref The DocumentReference to update.
 * @param data The data to update with.
 * @returns A boolean indicating success (true) or failure (false).
 */
export async function updateDocument<T>(ref: DocumentReference<T>, data: UpdateData<T>): Promise<boolean> {
    try {
        await updateDoc(ref, data);
        return true;
    } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'update',
            requestResourceData: data,
        }));
        return false;
    }
}

/**
 * Safely deletes a document, handling permissions errors.
 * @param ref The DocumentReference to delete.
 * @returns A boolean indicating success (true) or failure (false).
 */
export async function deleteDocument(ref: DocumentReference<any>): Promise<boolean> {
    try {
        await deleteDoc(ref);
        return true;
    } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'delete',
        }));
        return false;
    }
}

/**
 * Safely commits a write batch, handling permissions errors.
 * @param batch The WriteBatch to commit.
 * @param operationDescription A brief description of the batch operation for error logging.
 * @returns A boolean indicating success (true) or failure (false).
 */
export async function commitBatch(batch: ReturnType<typeof writeBatch>, operationDescription: string): Promise<boolean> {
    try {
        await batch.commit();
        return true;
    } catch (serverError: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `batch operation: ${operationDescription}`,
            operation: 'write',
        }));
        return false;
    }
}
