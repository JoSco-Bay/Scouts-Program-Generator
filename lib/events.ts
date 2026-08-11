import type { EventData } from './types';

const STORAGE_KEY = 'events';

function readStore(): Record<string, EventData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, EventData>): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadEvent(id: string): EventData | null {
  return readStore()[id] ?? null;
}

export function saveEvent(event: EventData): void {
  const store = readStore();
  store[event.id] = event;
  writeStore(store);
}

export function deleteEvent(id: string): void {
  const store = readStore();
  delete store[id];
  writeStore(store);
}
