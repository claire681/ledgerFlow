/**
 * LedgerFlow Memory Service — Frontend
 * Manages user preferences and local memory caching.
 */

import { getPreferences, setPreference, setPreferencesBulk } from './api';

// ── Default preferences ───────────────────────────────────────────────────
const DEFAULTS = {
  default_currency:     'USD',
  default_country:      'US',
  default_province:     '',
  theme:                'light',
  notifications:        'true',
  onboarding_done:      'false',
  ai_suggestions_shown: 'true',
};

// ── Get all preferences ───────────────────────────────────────────────────
export async function loadPreferences() {
  try {
    const res  = await getPreferences();
    const data = res.data?.preferences || {};

    // Merge with defaults
    return { ...DEFAULTS, ...data };
  } catch {
    // Fall back to localStorage
    const local = {};
    Object.keys(DEFAULTS).forEach(key => {
      const val = localStorage.getItem(`pref_${key}`);
      if (val !== null) local[key] = val;
    });
    return { ...DEFAULTS, ...local };
  }
}

// ── Save a preference ─────────────────────────────────────────────────────
export async function savePreference(key, value) {
  // Always save to localStorage first as backup
  localStorage.setItem(`pref_${key}`, String(value));

  // Then save to backend
  try {
    await setPreference(key, String(value));
    return true;
  } catch {
    return false;
  }
}

// ── Save multiple preferences ─────────────────────────────────────────────
export async function savePreferences(data) {
  // Save all to localStorage
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(`pref_${key}`, String(value));
  });

  // Save to backend
  try {
    const stringData = {};
    Object.entries(data).forEach(([key, value]) => {
      stringData[key] = String(value);
    });
    await setPreferencesBulk(stringData);
    return true;
  } catch {
    return false;
  }
}

// ── Get a single preference from localStorage ─────────────────────────────
export function getLocalPreference(key, fallback = null) {
  const val = localStorage.getItem(`pref_${key}`);
  if (val !== null) return val;
  return DEFAULTS[key] ?? fallback;
}

// ── Clear all local preferences ───────────────────────────────────────────
export function clearLocalPreferences() {
  Object.keys(DEFAULTS).forEach(key => {
    localStorage.removeItem(`pref_${key}`);
  });
}

// ── Save last visited page ────────────────────────────────────────────────
export function saveLastPage(path) {
  localStorage.setItem('last_page', path);
}

// ── Get last visited page ─────────────────────────────────────────────────
export function getLastPage() {
  return localStorage.getItem('last_page') || '/';
}

// ── Save draft data ───────────────────────────────────────────────────────
export function saveDraft(key, data) {
  try {
    localStorage.setItem(`draft_${key}`, JSON.stringify(data));
  } catch {
    // Silent fail if localStorage is full
  }
}

// ── Get draft data ────────────────────────────────────────────────────────
export function getDraft(key) {
  try {
    const raw = localStorage.getItem(`draft_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Clear a draft ─────────────────────────────────────────────────────────
export function clearDraft(key) {
  localStorage.removeItem(`draft_${key}`);
}