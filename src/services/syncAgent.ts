// AgroPulse Sync Agent — Offline-First Background Sync to Supabase

import { getUnsyncedScans, markAsSynced, getImageBlob } from './database';

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;

// ═══════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════
let syncTimerId: number | null = null;
let isRunning = false;
let listeners: Array<(status: SyncStatus) => void> = [];

export interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt: number | null;
    lastError: string | null;
}

let currentStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
};

// ═══════════════════════════════════════════════════════════════
// Status Management
// ═══════════════════════════════════════════════════════════════
function updateStatus(partial: Partial<SyncStatus>) {
    currentStatus = { ...currentStatus, ...partial };
    listeners.forEach(fn => fn(currentStatus));
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    listeners.push(callback);
    callback(currentStatus); // immediate call with current state
    return () => {
        listeners = listeners.filter(fn => fn !== callback);
    };
}

export function getSyncStatus(): SyncStatus {
    return { ...currentStatus };
}

// ═══════════════════════════════════════════════════════════════
// Supabase API Helpers
// ═══════════════════════════════════════════════════════════════
async function supabaseInsert(table: string, data: Record<string, unknown>): Promise<boolean> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('[SyncAgent] Supabase not configured, skipping upload');
        return false;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(data),
        });
        return response.ok;
    } catch (err) {
        console.error(`[SyncAgent] Insert to ${table} failed:`, err);
        return false;
    }
}

async function supabaseUploadImage(scanId: string, blob: Blob): Promise<string | null> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    try {
        const filePath = `scans/${scanId}.jpg`;
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/scan-images/${filePath}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg',
            },
            body: blob,
        });

        if (response.ok) {
            return `${SUPABASE_URL}/storage/v1/object/public/scan-images/${filePath}`;
        }
        return null;
    } catch (err) {
        console.error('[SyncAgent] Image upload failed:', err);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// Sync Logic
// ═══════════════════════════════════════════════════════════════
async function syncOne(scanId: string, scanData: Record<string, unknown>): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            // Upload image first
            const imageBlob = await getImageBlob(scanId);
            let imageUrl: string | null = null;
            if (imageBlob) {
                imageUrl = await supabaseUploadImage(scanId, imageBlob);
            }

            // Insert scan record
            const success = await supabaseInsert('scan_results', {
                ...scanData,
                cloud_image_url: imageUrl,
            });

            if (success) {
                await markAsSynced(scanId);
                return true;
            }
        } catch (err) {
            console.warn(`[SyncAgent] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed for ${scanId}:`, err);
            if (attempt < MAX_RETRY_ATTEMPTS) {
                await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff
            }
        }
    }
    return false;
}

async function runSyncCycle(): Promise<void> {
    if (currentStatus.isSyncing || !navigator.onLine) return;

    try {
        updateStatus({ isSyncing: true, isOnline: true });

        const unsynced = await getUnsyncedScans();
        updateStatus({ pendingCount: unsynced.length });

        if (unsynced.length === 0) {
            updateStatus({ isSyncing: false });
            return;
        }

        console.log(`[SyncAgent] Syncing ${unsynced.length} records...`);

        let syncedCount = 0;
        for (const scan of unsynced) {
            const success = await syncOne(scan.id, {
                id: scan.id,
                crop_type: scan.cropType,
                disease_id: scan.diseaseId,
                disease_name: scan.diseaseName,
                confidence_score: scan.confidenceScore,
                severity: scan.severity,
                image_path: scan.imagePath,
                scanned_at: new Date(scan.timestamp).toISOString(),
                latitude: scan.latitude,
                longitude: scan.longitude,
                plot_name: scan.plotName,
            });

            if (success) syncedCount++;
        }

        updateStatus({
            isSyncing: false,
            pendingCount: unsynced.length - syncedCount,
            lastSyncAt: Date.now(),
            lastError: null,
        });

        console.log(`[SyncAgent] Synced ${syncedCount}/${unsynced.length} records`);
    } catch (err) {
        updateStatus({
            isSyncing: false,
            lastError: err instanceof Error ? err.message : 'Unknown sync error',
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// Agent Lifecycle
// ═══════════════════════════════════════════════════════════════
export function startSyncAgent(): void {
    if (isRunning) return;
    isRunning = true;

    // Network event listeners
    window.addEventListener('online', () => {
        updateStatus({ isOnline: true });
        runSyncCycle(); // immediate sync when connection restored
    });

    window.addEventListener('offline', () => {
        updateStatus({ isOnline: false });
    });

    // Periodic sync check
    syncTimerId = window.setInterval(runSyncCycle, SYNC_INTERVAL_MS);

    // Initial sync
    runSyncCycle();

    console.log('[SyncAgent] Background sync agent started');
}

export function stopSyncAgent(): void {
    if (syncTimerId !== null) {
        clearInterval(syncTimerId);
        syncTimerId = null;
    }
    isRunning = false;
    console.log('[SyncAgent] Background sync agent stopped');
}

// Trigger manual sync
export function triggerSync(): void {
    runSyncCycle();
}
