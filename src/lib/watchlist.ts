import type { AnimeSearchResult } from '../types/anime';

const WATCHLIST_KEY = 'animeav1_lite_watchlist_v1';
const HISTORY_KEY = 'animeav1_lite_history_v1';

export interface WatchProgress {
  animeId: string;
  animeTitle: string;
  episode: number;
  episodeTitle: string;
  updatedAt: number;
}

export function loadWatchlist(): AnimeSearchResult[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: AnimeSearchResult[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function loadWatchHistory(): Record<string, WatchProgress> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordWatchProgress(entry: WatchProgress): Record<string, WatchProgress> {
  const current = loadWatchHistory();
  const next = {
    ...current,
    [entry.animeId]: entry,
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}
