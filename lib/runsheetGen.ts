import type { GroupConfig, TermRow, RunSheetData } from './types';

export interface MultiDayInfo {
  eventName: string;
  dayNumber: number;
  totalDays: number;
  location: string;
}

export async function generateRunSheet(
  row: TermRow,
  config: GroupConfig,
  multiDayInfo?: MultiDayInfo,
  instructions?: string,
): Promise<RunSheetData> {
  const res = await fetch('/api/generate-runsheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row, config, multiDayInfo, instructions }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  if (!json.activities || !Array.isArray(json.activities)) throw new Error('No activities returned from AI');
  return json as RunSheetData;
}
