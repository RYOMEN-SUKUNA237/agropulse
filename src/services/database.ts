// AgroPulse Local Database — IndexedDB Persistence Layer — v3

export interface ScanResult {
    id: string;
    cropType: 'Cocoa' | 'Coffee' | 'Tomato' | 'Banana' | 'Maize';  // expanded to 5 crops
    diseaseId: string;
    diseaseName: string;
    confidenceScore: number;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    imagePath: string;       // kept for schema compat, but NOT used for display (Bug B fix)
    imageBlob?: Blob;        // stored separately in blob store
    timestamp: number;
    latitude?: number;
    longitude?: number;
    plotName?: string;
    synced: boolean;
    syncedAt?: number;
}

const DB_NAME    = 'agropulse_db';
const DB_VERSION = 2;           // bumped for 5-crop schema update
const SCANS_STORE  = 'scan_results';
const IMAGES_STORE = 'scan_images';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror   = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(SCANS_STORE)) {
                const store = db.createObjectStore(SCANS_STORE, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('cropType',  'cropType',  { unique: false });
                store.createIndex('synced',    'synced',    { unique: false });
            }
            if (!db.objectStoreNames.contains(IMAGES_STORE)) {
                db.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
            }
        };
    });
}

export async function saveScanResult(scan: ScanResult, imageBlob?: Blob): Promise<void> {
    const db = await openDB();
    const tx = db.transaction([SCANS_STORE, IMAGES_STORE], 'readwrite');

    const scanToStore = { ...scan };
    delete scanToStore.imageBlob;  // never persist blob inside scan record
    tx.objectStore(SCANS_STORE).put(scanToStore);

    if (imageBlob) {
        tx.objectStore(IMAGES_STORE).put({ id: scan.id, blob: imageBlob });
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror    = () => reject(tx.error);
    });
}

export async function getAllScans(): Promise<ScanResult[]> {
    const db    = await openDB();
    const tx    = db.transaction(SCANS_STORE, 'readonly');
    const index = tx.objectStore(SCANS_STORE).index('timestamp');

    return new Promise((resolve, reject) => {
        const results: ScanResult[] = [];
        const req = index.openCursor(null, 'prev'); // newest first
        req.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) { results.push(cursor.value); cursor.continue(); }
            else resolve(results);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getScanById(id: string): Promise<ScanResult | undefined> {
    const db = await openDB();
    const tx = db.transaction(SCANS_STORE, 'readonly');
    return new Promise((resolve, reject) => {
        const req = tx.objectStore(SCANS_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

/**
 * Fetch the raw Blob for a scan from the images store.
 * Used by useImageBlob hook to create fresh, revocable object URLs (Bug B fix).
 */
export async function getImageBlob(scanId: string): Promise<Blob | undefined> {
    const db = await openDB();
    const tx = db.transaction(IMAGES_STORE, 'readonly');
    return new Promise((resolve, reject) => {
        const req = tx.objectStore(IMAGES_STORE).get(scanId);
        req.onsuccess = () => resolve(req.result?.blob);
        req.onerror   = () => reject(req.error);
    });
}

export async function getUnsyncedScans(): Promise<ScanResult[]> {
    const db    = await openDB();
    const tx    = db.transaction(SCANS_STORE, 'readonly');
    const index = tx.objectStore(SCANS_STORE).index('synced');

    return new Promise((resolve, reject) => {
        const req = index.getAll(false as any);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

export async function markAsSynced(id: string): Promise<void> {
    const db    = await openDB();
    const tx    = db.transaction(SCANS_STORE, 'readwrite');
    const store = tx.objectStore(SCANS_STORE);

    return new Promise((resolve, reject) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const scan = getReq.result;
            if (scan) {
                scan.synced   = true;
                scan.syncedAt = Date.now();
                store.put(scan);
            }
            resolve();
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

export async function getScanStats(): Promise<{
    totalScans: number;
    activePlots: number;
    healthIndex: number;
    cropCounts: Record<string, number>;
}> {
    const scans       = await getAllScans();
    const plots       = new Set(scans.map(s => s.plotName || 'default'));
    const healthyCount = scans.filter(s => s.diseaseName === 'Healthy').length;
    const healthIndex = scans.length > 0 ? Math.round((healthyCount / scans.length) * 100) : 100;

    const cropCounts: Record<string, number> = {};
    scans.forEach(s => {
        cropCounts[s.cropType] = (cropCounts[s.cropType] || 0) + 1;
    });

    return {
        totalScans: scans.length,
        activePlots: Math.max(plots.size, 1),
        healthIndex,
        cropCounts,
    };
}

export function generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
