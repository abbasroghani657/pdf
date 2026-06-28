/**
 * useToolSession — Global session persistence for all PDF tool pages.
 * 
 * Automatically saves the uploaded File object name + any state to sessionStorage.
 * On reload, restores the state. Since the actual File object cannot be stored,
 * we store file metadata and any serializable tool state (settings, options, etc.)
 *
 * Usage:
 *   const { saveSession, clearSession, restoreSession } = useToolSession('compress');
 */

import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const SESSION_PREFIX = 'toolsession_';

// ─── IndexedDB helpers (for storing actual file bytes) ────────────────────────
const IDB_NAME = 'theylovepdf_sessions';
const IDB_STORE = 'files';

const openIDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(IDB_NAME, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
  req.onsuccess = e => resolve(e.target.result);
  req.onerror = () => reject(req.error);
});

const saveFileToIDB = async (toolKey, bytes) => {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(bytes, toolKey);
    await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
  } catch (e) { console.warn('[Session] IDB save failed', e); }
};

export const loadFileFromIDB = async (toolKey) => {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(toolKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
};

const clearFileFromIDB = async (toolKey) => {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(toolKey);
  } catch (e) {}
};
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} toolKey   - Unique key for this tool, e.g. 'compress', 'rotate', 'split'
 * @param {object} state     - Current serializable state to auto-save
 * @param {File|null} file   - Current file object (bytes will be stored in IDB)
 * @param {function} onRestore - Called with ({ state, bytes }) when session is restored
 * @param {boolean} enabled  - Whether auto-save is active (e.g. false until file selected)
 */
export function useToolSession(toolKey, state, file, onRestore, enabled = true) {
  const sessionKey = SESSION_PREFIX + toolKey;

  // ── Auto-save whenever state or file changes ─────────────────────────────
  useEffect(() => {
    if (!enabled || !file) return;

    const saveSession = async () => {
      try {
        // Save file bytes to IndexedDB
        const bytes = await file.arrayBuffer();
        await saveFileToIDB(toolKey, new Uint8Array(bytes));

        // Save metadata + state to sessionStorage
        sessionStorage.setItem(sessionKey, JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: Date.now(),
          state,
        }));
      } catch (e) {
        console.warn('[Session] Auto-save failed', e);
      }
    };

    saveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(state), file?.name, enabled]);

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return;

      try {
        const saved = JSON.parse(raw);

        // Ignore sessions older than 2 hours
        if (Date.now() - saved.timestamp > 2 * 60 * 60 * 1000) {
          clearSession();
          return;
        }

        const bytes = await loadFileFromIDB(toolKey);
        if (!bytes || bytes.length === 0) return;

        // Call the restore handler provided by the tool page
        if (onRestore) {
          onRestore({
            state: saved.state,
            bytes,
            fileName: saved.fileName,
            fileSize: saved.fileSize,
            fileType: saved.fileType,
          });
          toast.success(`Session restored: ${saved.fileName}`, {
            id: 'session-restore',
            icon: '🔄',
            duration: 3000,
          });
        }
      } catch (e) {
        console.warn('[Session] Restore failed', e);
        clearSession();
      }
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual helpers ───────────────────────────────────────────────────────
  const clearSession = useCallback(async () => {
    sessionStorage.removeItem(sessionKey);
    await clearFileFromIDB(toolKey);
  }, [sessionKey, toolKey]);

  return { clearSession };
}
