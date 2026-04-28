import { useState, useEffect, useCallback } from 'react';
import {
  getPreferences,
  setPreference,
  setPreferencesBulk,
  getAIMemory,
  clearAIMemory,
  refreshAIMemory,
} from '../services/api';

/**
 * useMemory — Hook for managing user preferences and AI memory.
 *
 * Usage:
 *   const { prefs, setPref, memory } = useMemory();
 *   setPref('default_currency', 'CAD');
 */
export function useMemory() {
  const [prefs,          setPrefs]         = useState({});
  const [memory,         setMemory]        = useState([]);
  const [loadingPrefs,   setLoadingPrefs]  = useState(true);
  const [loadingMemory,  setLoadingMemory] = useState(false);

  // ── Load preferences on mount ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Try backend first
        const res = await getPreferences();
        const backendPrefs = res.data?.preferences || {};

        // Merge with localStorage as fallback
        const localPrefs = {};
        const keys = [
          'default_currency', 'default_country', 'theme',
          'default_province', 'notifications_enabled',
        ];
        keys.forEach(key => {
          const val = localStorage.getItem(`pref_${key}`);
          if (val) localPrefs[key] = val;
        });

        setPrefs({ ...localPrefs, ...backendPrefs });
      } catch {
        // Fall back to localStorage only
        const localPrefs = {};
        const keys = [
          'default_currency', 'default_country', 'theme',
          'default_province', 'notifications_enabled',
        ];
        keys.forEach(key => {
          const val = localStorage.getItem(`pref_${key}`);
          if (val) localPrefs[key] = val;
        });
        setPrefs(localPrefs);
      } finally {
        setLoadingPrefs(false);
      }
    };
    load();
  }, []);

  // ── Set a single preference ───────────────────────────────────────────
  const setPref = useCallback(async (key, value) => {
    // Update state immediately
    setPrefs(prev => ({ ...prev, [key]: value }));

    // Save to localStorage as backup
    localStorage.setItem(`pref_${key}`, value);

    // Save to backend
    try {
      await setPreference(key, value);
    } catch {
      // Silent fail — localStorage backup is enough
    }
  }, []);

  // ── Set multiple preferences ──────────────────────────────────────────
  const setPrefs_ = useCallback(async (data) => {
    setPrefs(prev => ({ ...prev, ...data }));

    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(`pref_${key}`, value);
    });

    try {
      await setPreferencesBulk(data);
    } catch {
      // Silent fail
    }
  }, []);

  // ── Get a single preference with fallback ─────────────────────────────
  const getPref = useCallback((key, fallback = null) => {
    return prefs[key] ?? fallback;
  }, [prefs]);

  // ── Load AI memory ────────────────────────────────────────────────────
  const loadMemory = useCallback(async () => {
    setLoadingMemory(true);
    try {
      const res = await getAIMemory();
      setMemory(res.data || []);
    } catch {
      setMemory([]);
    } finally {
      setLoadingMemory(false);
    }
  }, []);

  // ── Clear AI memory ───────────────────────────────────────────────────
  const clearMemory = useCallback(async () => {
    try {
      await clearAIMemory();
      setMemory([]);
    } catch {
      // Silent fail
    }
  }, []);

  // ── Refresh AI memory ─────────────────────────────────────────────────
  const refreshMemory = useCallback(async () => {
    try {
      await refreshAIMemory();
      await loadMemory();
    } catch {
      // Silent fail
    }
  }, [loadMemory]);

  return {
    // Preferences
    prefs,
    getPref,
    setPref,
    setPrefs: setPrefs_,
    loadingPrefs,

    // AI Memory
    memory,
    loadingMemory,
    loadMemory,
    clearMemory,
    refreshMemory,
  };
}

export default useMemory;