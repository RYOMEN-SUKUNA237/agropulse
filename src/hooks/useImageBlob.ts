/**
 * useImageBlob — Bug B Fix
 * ========================
 * Retrieves the raw image Blob from IndexedDB and creates a fresh
 * object URL on mount, revoked on unmount. This prevents the "broken
 * image" problem caused by stale blob: URLs stored in scan records,
 * which expire after the originating page session ends.
 *
 * Usage:
 *   const blobUrl = useImageBlob(scan.id);
 *   <img src={blobUrl ?? ''} />
 */

import { useState, useEffect } from 'react';
import { getImageBlob } from '../services/database';

export function useImageBlob(scanId: string | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    getImageBlob(scanId)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.warn(`[useImageBlob] Failed to load blob for ${scanId}:`, err);
      });

    // Cleanup: revoke the object URL when the component unmounts
    // or scanId changes, to release memory
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [scanId]);

  return blobUrl;
}
