/**
 * AI Compose — Settings Service
 *
 * Manages user preferences and API configuration.
 * Persists settings to localStorage (syncs automatically across sessions).
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import { initGeminiClient } from "../services/gemini";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tone options available across Draft and Reply features. */
export type Tone = "professional" | "formal" | "friendly" | "casual";

/** Summary style options for the Summarize feature. */
export type SummaryStyle = "bullets" | "paragraph" | "tldr";

/** All persisted user preferences. */
export interface AIComposeSettings {
  /** Google Gemini API key (stored in plain text in localStorage). */
  apiKey: string;
  /** Gemini model to use for all features. */
  defaultModel: string;
  /** Default tone for Draft Email and Reply. */
  defaultTone: Tone;
  /** Default summary style for Summarize. */
  defaultSummaryStyle: SummaryStyle;
  /** Default target language for Translate. */
  defaultLanguage: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const STORAGE_KEY = "ai_compose_settings";
const LEGACY_STORAGE_KEY = "glide_settings";

const DEFAULT_SETTINGS: AIComposeSettings = {
  apiKey: "",
  defaultModel: "gemini-3-flash-preview",
  defaultTone: "professional",
  defaultSummaryStyle: "bullets",
  defaultLanguage: "English",
};

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let cached: AIComposeSettings | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load settings from localStorage (or return defaults).
 */
export function loadSettings(): AIComposeSettings {
  if (cached) return { ...cached };

  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    // One-time migration from legacy "glide_settings" key
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AIComposeSettings>;
      cached = { ...DEFAULT_SETTINGS, ...parsed };
    } else {
      cached = { ...DEFAULT_SETTINGS };
    }
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }

  return { ...cached };
}

/**
 * Save settings to localStorage and update the in-memory cache.
 * If the API key changed, automatically re-initializes the Gemini client.
 */
export function saveSettings(settings: AIComposeSettings): void {
  const previousKey = cached?.apiKey || "";

  cached = { ...settings };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage might be unavailable in some sandboxed environments
  }

  // Re-initialize Gemini client if the API key changed
  if (settings.apiKey && settings.apiKey !== previousKey) {
    try {
      initGeminiClient(settings.apiKey);
    } catch {
      // Will be retried on next action
    }
  }
}

/**
 * Get the current API key (loads settings if not cached).
 */
export function getApiKey(): string {
  return loadSettings().apiKey;
}

/**
 * Update just the API key (convenience method).
 */
export function setApiKey(key: string): void {
  const settings = loadSettings();
  settings.apiKey = key;
  saveSettings(settings);
}

/**
 * Get a single setting value.
 */
export function getSetting<K extends keyof AIComposeSettings>(key: K): AIComposeSettings[K] {
  return loadSettings()[key];
}

/**
 * Reset all settings to defaults and clear localStorage.
 */
export function resetSettings(): void {
  cached = { ...DEFAULT_SETTINGS };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
