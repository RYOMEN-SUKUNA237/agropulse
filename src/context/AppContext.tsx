// AgroPulse Global State — React Context for scan pipeline + data binding
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { runDiagnosis, type DiagnosisResult } from '../services/aiPipeline';
import { saveScanResult, getAllScans, getScanStats, generateScanId, type ScanResult } from '../services/database';
import { startSyncAgent, onSyncStatusChange, type SyncStatus } from '../services/syncAgent';

interface AppState {
    scans: ScanResult[];
    stats: { totalScans: number; activePlots: number; healthIndex: number; cropCounts: Record<string, number> };
    syncStatus: SyncStatus;
    isScanning: boolean;
    lastResult: DiagnosisResult | null;
    lastImageUrl: string | null;
    scanError: string | null;
    performScan: (file: File) => Promise<void>;
    clearResult: () => void;
    refreshScans: () => Promise<void>;
}

const defaultStats = { totalScans: 0, activePlots: 1, healthIndex: 100, cropCounts: {} };
const defaultSync: SyncStatus = { isOnline: navigator.onLine, isSyncing: false, pendingCount: 0, lastSyncAt: null, lastError: null };

const AppContext = createContext<AppState>({
    scans: [], stats: defaultStats, syncStatus: defaultSync,
    isScanning: false, lastResult: null, lastImageUrl: null, scanError: null,
    performScan: async () => { }, clearResult: () => { }, refreshScans: async () => { },
});

export function useApp() { return useContext(AppContext); }

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [scans, setScans] = useState<ScanResult[]>([]);
    const [stats, setStats] = useState(defaultStats);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSync);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<DiagnosisResult | null>(null);
    const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const initialized = useRef(false);

    const refreshScans = useCallback(async () => {
        try {
            const [allScans, scanStats] = await Promise.all([getAllScans(), getScanStats()]);
            setScans(allScans);
            setStats(scanStats);
        } catch (err) { console.error('Failed to refresh scans:', err); }
    }, []);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        refreshScans();
        startSyncAgent();
        const unsub = onSyncStatusChange(setSyncStatus);
        return unsub;
    }, [refreshScans]);

    const performScan = useCallback(async (file: File) => {
        setIsScanning(true);
        setScanError(null);
        setLastResult(null);
        try {
            const previewUrl = URL.createObjectURL(file);
            setLastImageUrl(previewUrl);
            const result = await runDiagnosis(file);
            setLastResult(result);

            const scanRecord: ScanResult = {
                id: generateScanId(),
                cropType: result.crop,
                diseaseId: result.disease.id,
                diseaseName: result.disease.name,
                confidenceScore: result.diseaseConfidence,
                severity: result.severity,
                imagePath: previewUrl,
                timestamp: Date.now(),
                synced: false,
                plotName: `Plot ${Math.floor(Math.random() * 12) + 1}`,
            };

            const blob = file.slice(0, file.size, file.type);
            await saveScanResult(scanRecord, blob);
            await refreshScans();
        } catch (err) {
            setLastResult(null);
            setScanError(err instanceof Error ? err.message : 'Scan failed');
        } finally {
            setIsScanning(false);
        }
    }, [refreshScans]);

    const clearResult = useCallback(() => {
        setLastResult(null);
        setLastImageUrl(null);
        setScanError(null);
    }, []);

    return (
        <AppContext.Provider value={{ scans, stats, syncStatus, isScanning, lastResult, lastImageUrl, scanError, performScan, clearResult, refreshScans }}>
            {children}
        </AppContext.Provider>
    );
}
