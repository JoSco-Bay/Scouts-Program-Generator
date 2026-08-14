import { supabase } from './supabase';
import type { GroupConfig, TermRow, Member, SavedRunSheet } from './types';

// ── Local group identity ──────────────────────────────────────────────────────

function getLocalGroupId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('groupId');
}

function setLocalGroupId(id: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('groupId', id);
}

// ── Groups ────────────────────────────────────────────────────────────────────

export interface GroupRecord {
  id: string;
  config: GroupConfig;
}

export async function loadGroupRecord(_userId: string): Promise<GroupRecord | null> {
  const gid = getLocalGroupId();
  if (!gid) return null;
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', gid)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      config: {
        groupName:   data.group_name,
        section:     data.section,
        meetingDay:  data.meeting_day,
        meetingTime: data.meeting_time,
        leaders:     data.leaders  || [],
        members:     data.members  || [],
      },
    };
  } catch (e) {
    console.error('Supabase group load failed:', e);
    return null;
  }
}

export async function saveGroupConfig(
  _userId: string,
  groupId: string | null,
  config: GroupConfig,
): Promise<string> {
  const payload = {
    group_name:   config.groupName,
    section:      config.section,
    meeting_day:  config.meetingDay,
    meeting_time: config.meetingTime,
    leaders:      config.leaders,
    members:      config.members,
    updated_at:   new Date().toISOString(),
  };
  try {
    const gid = groupId || getLocalGroupId();
    if (gid) {
      const { error } = await supabase.from('groups').update(payload).eq('id', gid);
      if (error) throw new Error(`Failed to update group: ${error.message}`);
      return gid;
    }
    const { data, error } = await supabase
      .from('groups')
      .insert(payload)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`Failed to insert group: ${error.message}`);
    if (!data) throw new Error('Group record not returned after insert');
    setLocalGroupId(data.id);
    return data.id;
  } catch (e) {
    throw e instanceof Error ? e : new Error('Failed to save group config');
  }
}

// ── Term Rows ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowFromDb(d: any): TermRow {
  return {
    id:              d.id,
    date:            d.date,
    time:            d.time,
    topic:           d.topic,
    location:        d.location,
    oasFocus:        d.oas_focus,
    sessionNotes:    d.session_notes,
    bring:           d.bring,
    leader:          d.leader,
    assistantPatrol: d.assistant_patrol,
    consentRequired: d.consent_required,
    rowType:         d.row_type,
  };
}

function rowToDb(r: TermRow, groupId: string, sortOrder: number) {
  return {
    id:               r.id,
    group_id:         groupId,
    date:             r.date,
    time:             r.time,
    topic:            r.topic,
    location:         r.location,
    oas_focus:        r.oasFocus,
    session_notes:    r.sessionNotes,
    bring:            r.bring,
    leader:           r.leader,
    assistant_patrol: r.assistantPatrol,
    consent_required: r.consentRequired,
    row_type:         r.rowType,
    sort_order:       sortOrder,
  };
}

export async function loadTermRows(_userId: string): Promise<TermRow[]> {
  const gid = getLocalGroupId();
  if (!gid) return [];
  try {
    const { data, error } = await supabase
      .from('term_rows')
      .select('*')
      .eq('group_id', gid)
      .order('sort_order');
    if (error) throw error;
    return (data || []).map(rowFromDb);
  } catch (e) {
    console.error('Supabase term rows load failed:', e);
    return [];
  }
}

export async function upsertTermRows(_userId: string, groupId: string, rows: TermRow[]): Promise<void> {
  if (!rows.length) return;
  try {
    const { error } = await supabase
      .from('term_rows')
      .upsert(rows.map((r, i) => rowToDb(r, groupId, i)), { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.error('Supabase term rows save failed:', e);
  }
}

// Two overlapping replaceTermRows calls for the same group (e.g. a double-fired upload,
// a fast-refresh re-invoke) can otherwise interleave: both deletes see nothing to remove,
// then both inserts land, and the group ends up with both row sets coexisting. Queue calls
// per group so a second call always starts after the first has fully finished.
const replaceTermRowsQueues = new Map<string, Promise<unknown>>();

async function doReplaceTermRows(groupId: string, rows: TermRow[]): Promise<void> {
  // run_sheets.term_row_id has a foreign key onto term_rows.id — deleting a term_row while
  // a run sheet still references it fails with a FK violation (this is what breaks a plan
  // upload once any session has a generated run sheet). Detach those run sheets first
  // (term_row_id is nullable) rather than deleting them, so a leader's generated content
  // survives as an unlinked run sheet instead of blocking the replace or being destroyed.
  const { error: detachError } = await supabase
    .from('run_sheets')
    .update({ term_row_id: null })
    .eq('group_id', groupId);
  if (detachError) throw detachError;

  // Delete, then verify the group is actually clear before inserting — a delete that
  // silently leaves rows behind must never let the new set coexist with the old one.
  for (let attempt = 0; ; attempt++) {
    const { error: delError } = await supabase.from('term_rows').delete().eq('group_id', groupId);
    if (delError) throw delError;
    const { count, error: countError } = await supabase
      .from('term_rows')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (countError) throw countError;
    if (!count) break;
    if (attempt >= 2) throw new Error(`Could not clear existing term rows for group ${groupId} (${count} still remain after 3 attempts)`);
  }
  if (rows.length) {
    const { error } = await supabase.from('term_rows').insert(rows.map((r, i) => rowToDb(r, groupId, i)));
    if (error) throw error;
  }
}

export async function replaceTermRows(_userId: string, groupId: string, rows: TermRow[]): Promise<void> {
  const prior = replaceTermRowsQueues.get(groupId) ?? Promise.resolve();
  const run = prior.then(
    () => doReplaceTermRows(groupId, rows),
    () => doReplaceTermRows(groupId, rows),
  ).catch(e => { console.error('Supabase term rows replace failed:', e); });
  replaceTermRowsQueues.set(groupId, run);
  return run;
}

export async function deleteTermRow(_userId: string, rowId: string): Promise<void> {
  try {
    const { error } = await supabase.from('term_rows').delete().eq('id', rowId);
    if (error) throw error;
  } catch (e) {
    console.error('Supabase term row delete failed:', e);
  }
}

// ── Members ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function memberFromDb(d: any): Member {
  return {
    id:                  d.id,
    firstName:           d.first_name,
    lastName:            d.last_name,
    age:                 d.age,
    yearJoined:          d.year_joined,
    attendance:          d.attendance          || {},
    oas:                 d.oas                 || {},
    sia:                 d.sia                 || [],
    milestoneActivities: d.milestone_activities || [],
    milestonesAwarded:   d.milestones_awarded   || [],
    peakAwarded:         d.peak_awarded         || false,
  };
}

function memberToDb(m: Member, groupId: string) {
  return {
    id:                   m.id,
    group_id:             groupId,
    first_name:           m.firstName,
    last_name:            m.lastName,
    age:                  m.age,
    year_joined:          m.yearJoined,
    attendance:           m.attendance,
    oas:                  m.oas,
    sia:                  m.sia,
    milestone_activities: m.milestoneActivities,
    milestones_awarded:   m.milestonesAwarded,
    peak_awarded:         m.peakAwarded,
  };
}

function getLocalMembersCache(): Member[] {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem('members');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function setLocalMembersCache(members: Member[]): void {
  if (typeof window !== 'undefined') localStorage.setItem('members', JSON.stringify(members));
}

export async function loadMembers(_userId: string): Promise<Member[]> {
  const gid = getLocalGroupId();
  if (!gid) return getLocalMembersCache();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', gid)
    .order('created_at');
  // Supabase is the source of truth only when it actually returns rows — an error or an
  // empty result both fall back to the local cache instead of ever being combined with it.
  if (error || !data || data.length === 0) return getLocalMembersCache();
  const members = data.map(memberFromDb);
  setLocalMembersCache(members);
  return members;
}

export async function upsertMembers(_userId: string, groupId: string, members: Member[]): Promise<void> {
  if (!members.length) return;
  const { error } = await supabase
    .from('members')
    .upsert(members.map(m => memberToDb(m, groupId)), { onConflict: 'id' });
  if (!error) {
    const byId = new Map(getLocalMembersCache().map(m => [m.id, m]));
    members.forEach(m => byId.set(m.id, m));
    setLocalMembersCache(Array.from(byId.values()));
  }
}

// Loading a saved plan file replaces the member list wholesale, the same way it replaces
// term rows. Upserting the file's members by id is not safe here: a re-uploaded (or older)
// file's member ids can differ from whatever ids the group's members already have, so an
// upsert just adds duplicate-by-name rows instead of recognizing them as the same person.
// Mirrors replaceTermRows' queued, verify-before-insert pattern for the same race safety.
const replaceMembersQueues = new Map<string, Promise<unknown>>();

async function doReplaceMembers(groupId: string, members: Member[]): Promise<void> {
  // members.id is the table's primary key, global across all groups — not scoped per
  // group_id. If the same saved plan file (with the same baked-in member ids) is ever
  // uploaded into a different group than it was originally seeded into, those ids can
  // already exist under another group_id, and a plain insert hits a primary-key
  // collision. Clear the incoming ids globally as well as clearing this group.
  const incomingIds = members.map(m => m.id);
  if (incomingIds.length) {
    const { error: idClearError } = await supabase.from('members').delete().in('id', incomingIds);
    if (idClearError) throw idClearError;
  }

  for (let attempt = 0; ; attempt++) {
    const { error: delError } = await supabase.from('members').delete().eq('group_id', groupId);
    if (delError) throw delError;
    const { count, error: countError } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (countError) throw countError;
    if (!count) break;
    if (attempt >= 2) throw new Error(`Could not clear existing members for group ${groupId} (${count} still remain after 3 attempts)`);
  }
  if (members.length) {
    const { error } = await supabase.from('members').insert(members.map(m => memberToDb(m, groupId)));
    if (error) throw error;
  }
  setLocalMembersCache(members);
}

export async function replaceMembers(_userId: string, groupId: string, members: Member[]): Promise<void> {
  const prior = replaceMembersQueues.get(groupId) ?? Promise.resolve();
  const run = prior.then(
    () => doReplaceMembers(groupId, members),
    () => doReplaceMembers(groupId, members),
  ).catch(e => { console.error('Supabase members replace failed:', e); });
  replaceMembersQueues.set(groupId, run);
  return run;
}

export async function deleteMemberById(_userId: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (!error) setLocalMembersCache(getLocalMembersCache().filter(m => m.id !== memberId));
}

// ── Run Sheets ────────────────────────────────────────────────────────────────

export interface RunSheetEntry {
  dbId: string;
  termRowId: string | null;
  entry: SavedRunSheet;
}

// ── Run sheets localStorage cache (primary store — see CLAUDE.md) ────────────
// Object keyed by session row ID (SavedRunSheet.row.id), value is a RunSheetEntry.

function getRunSheetsCache(): Record<string, RunSheetEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('runsheets');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setRunSheetsCache(cache: Record<string, RunSheetEntry>): void {
  if (typeof window !== 'undefined') localStorage.setItem('runsheets', JSON.stringify(cache));
}

function cacheRunSheet(rowId: string, entry: RunSheetEntry): void {
  const cache = getRunSheetsCache();
  cache[rowId] = entry;
  setRunSheetsCache(cache);
}

export function getCachedRunSheetByRowId(rowId: string): RunSheetEntry | null {
  return getRunSheetsCache()[rowId] ?? null;
}

export async function loadRunSheets(_userId: string): Promise<RunSheetEntry[]> {
  const cached = getRunSheetsCache();
  const gid = getLocalGroupId();
  if (!gid) return Object.values(cached);
  try {
    const { data, error } = await supabase
      .from('run_sheets')
      .select('*')
      .eq('group_id', gid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    // localStorage is the primary source: keep cached entries, only add remote
    // rows for sessions we don't already have cached locally.
    const merged = { ...cached };
    for (const d of data || []) {
      const entry: RunSheetEntry = { dbId: d.id, termRowId: d.term_row_id, entry: d.data as SavedRunSheet };
      const rowId = entry.entry.row?.id;
      if (rowId && !merged[rowId]) merged[rowId] = entry;
    }
    setRunSheetsCache(merged);
    return Object.values(merged);
  } catch (e) {
    console.error('Supabase run sheets load failed; using localStorage cache:', e);
    return Object.values(cached);
  }
}

export async function loadRunSheetByTermRowId(
  _userId: string,
  termRowId: string,
): Promise<{ dbId: string; entry: SavedRunSheet } | null> {
  const gid = getLocalGroupId();
  if (!gid) return null;
  try {
    const { data, error } = await supabase
      .from('run_sheets')
      .select('*')
      .eq('group_id', gid)
      .eq('term_row_id', termRowId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { dbId: data.id, entry: data.data as SavedRunSheet };
  } catch (e) {
    console.error('Supabase run sheet load failed:', e);
    return null;
  }
}

export async function loadRunSheetById(dbId: string): Promise<SavedRunSheet | null> {
  try {
    const { data, error } = await supabase
      .from('run_sheets')
      .select('data')
      .eq('id', dbId)
      .maybeSingle();
    if (error) throw error;
    return data ? (data.data as SavedRunSheet) : null;
  } catch (e) {
    console.error('Supabase run sheet load failed:', e);
    return null;
  }
}

export async function deleteRunSheet(_userId: string, dbId: string, rowId: string): Promise<void> {
  try {
    const { error } = await supabase.from('run_sheets').delete().eq('id', dbId);
    if (error) throw error;
  } catch (e) {
    console.error('Supabase run sheet delete failed:', e);
  }
  // Always remove from localStorage — it's the primary store of record for run sheets
  // (see CLAUDE.md), so the deletion must stick even if the Supabase call failed.
  const cache = getRunSheetsCache();
  delete cache[rowId];
  setRunSheetsCache(cache);
}

export async function saveRunSheet(
  _userId: string,
  groupId: string,
  termRowId: string | null,
  sheet: SavedRunSheet,
  existingDbId?: string,
): Promise<string> {
  let dbId: string | undefined;
  try {
    if (existingDbId) {
      const { error } = await supabase.from('run_sheets').update({ data: sheet }).eq('id', existingDbId);
      if (error) throw error;
      dbId = existingDbId;
    } else {
      const { data, error } = await supabase
        .from('run_sheets')
        .insert({ group_id: groupId, term_row_id: termRowId, data: sheet })
        .select('id')
        .maybeSingle();
      if (error) throw error;
      dbId = data?.id;
    }
  } catch (e) {
    console.error('Supabase run sheet save failed; saved to localStorage only:', e);
  }
  // Always save to localStorage, keyed by session row ID — this is the fallback
  // of record when Supabase is unreachable (see CLAUDE.md).
  const cacheId = dbId ?? existingDbId ?? sheet.row.id;
  cacheRunSheet(sheet.row.id, { dbId: cacheId, termRowId, entry: sheet });
  return cacheId;
}
