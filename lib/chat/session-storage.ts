// Chat Session localStorage Persistence
// Allows users to refresh the page without losing chat progress

import { ChatSession } from '@/lib/types/chat-session';

export const STORAGE_KEY = 'chatSession';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if localStorage is available (handles SSR)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves the chat session to localStorage
 * @param session - The ChatSession to persist
 */
export function saveSession(session: ChatSession): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...session,
      updatedAt: Date.now()
    }));
  } catch {
    // Silently fail if storage is full or unavailable
    console.warn('Failed to save chat session to localStorage');
  }
}

/**
 * Loads the chat session from localStorage
 * Returns null if no session exists, session is expired, or data is corrupted
 */
export function loadSession(): ChatSession | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const session = JSON.parse(stored) as ChatSession;

    // Check if session has expired
    if (Date.now() - session.updatedAt > SESSION_EXPIRY_MS) {
      clearSession();
      return null;
    }

    // Restore Date objects in lastMessages[].timestamp
    // (JSON.parse converts Date objects to ISO strings)
    if (session.lastMessages && Array.isArray(session.lastMessages)) {
      session.lastMessages = session.lastMessages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }));
    }

    return session;
  } catch {
    // Handle corrupted data by clearing it
    console.warn('Failed to parse chat session from localStorage, clearing corrupted data');
    clearSession();
    return null;
  }
}

/**
 * Clears the chat session from localStorage
 */
export function clearSession(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
