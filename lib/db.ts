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

function recordFromDb(data: {
  id: string; group_name: string; section: string; meeting_day: string;
  meeting_time: string; leaders: string[] | null; members: string[] | null;
}): GroupRecord {
  return {
    id: data.id,
    config: {
      groupName:   data.group_name,
      section:     data.section as GroupConfig['section'],
      meetingDay:  data.meeting_day,
      meetingTime: data.meeting_time,
      leaders:     data.leaders  || [],
      members:     data.members  || [],
    },
  };
}

// Looks up the caller's group by their Supabase auth user_id — this is the
// authoritative lookup, independent of the browser's localStorage. A cleared
// cache no longer causes a fresh empty group to be created: the same user_id
// always finds the same group.
export async function loadGroupRecord(userId: string): Promise<GroupRecord | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.from('groups').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;

    if (data) {
      setLocalGroupId(data.id); // keep localStorage in sync as a fast local cache only
      return recordFromDb(data);
    }

    // One-time migration path: a group created before auth existed has no user_id
    // yet. If localStorage still points at one (from before a cache clear), claim
    // it for this user instead of letting them fall through to /setup and create
    // an unnecessary duplicate. After this runs once, the user_id lookup above
    // finds it directly and this branch is never needed again for that group.
    const gid = getLocalGroupId();
    if (gid) {
      const unclaimed = await supabase.from('groups').select('*').eq('id', gid).is('user_id', null).maybeSingle();
      if (unclaimed.data) {
        const { error: claimError } = await supabase.from('groups').update({ user_id: userId }).eq('id', gid);
        if (!claimError) return recordFromDb(unclaimed.data);
      }
    }

    return null;
  } catch (e) {
    console.error('Supabase group load failed:', e);
    return null;
  }
}

export async function saveGroupConfig(
  userId: string,
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
    ...(userId ? { user_id: userId } : {}),
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

function rowToDb(r: TermRow, groupId: string, termId: string, sortOrder: number) {
  return {
    id:               r.id,
    group_id:         groupId,
    term_id:          termId,
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

export async function loadTermRows(_userId: string, termId: string | null): Promise<TermRow[]> {
  const gid = getLocalGroupId();
  if (!gid || !termId) return [];
  try {
    const { data, error } = await supabase
      .from('term_rows')
      .select('*')
      .eq('group_id', gid)
      .eq('term_id', termId)
      .order('sort_order');
    if (error) throw error;
    return (data || []).map(rowFromDb);
  } catch (e) {
    console.error('Supabase term rows load failed:', e);
    return [];
  }
}

export async function upsertTermRows(_userId: string, groupId: string, termId: string, rows: TermRow[]): Promise<void> {
  if (!rows.length) return;
  try {
    const { error } = await supabase
      .from('term_rows')
      .upsert(rows.map((r, i) => rowToDb(r, groupId, termId, i)), { onConflict: 'id' });
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

async function doReplaceTermRows(groupId: string, termId: string, rows: TermRow[]): Promise<void> {
  // run_sheets.term_row_id has a foreign key onto term_rows.id — deleting a term_row while
  // a run sheet still references it fails with a FK violation (this is what breaks a plan
  // upload once any session has a generated run sheet). Detach those run sheets first
  // (term_row_id is nullable) rather than deleting them, so a leader's generated content
  // survives as an unlinked run sheet instead of blocking the replace or being destroyed.
  // Scoped to this term's rows only — another term's run sheets are never touched.
  const { data: existingRows, error: existingError } = await supabase
    .from('term_rows')
    .select('id')
    .eq('group_id', groupId)
    .eq('term_id', termId);
  if (existingError) throw existingError;
  const existingIds = (existingRows || []).map(r => r.id);
  if (existingIds.length) {
    const { error: detachError } = await supabase
      .from('run_sheets')
      .update({ term_row_id: null })
      .in('term_row_id', existingIds);
    if (detachError) throw detachError;
  }

  // Delete, then verify this term is actually clear before inserting — a delete that
  // silently leaves rows behind must never let the new set coexist with the old one.
  for (let attempt = 0; ; attempt++) {
    const { error: delError } = await supabase.from('term_rows').delete().eq('group_id', groupId).eq('term_id', termId);
    if (delError) throw delError;
    const { count, error: countError } = await supabase
      .from('term_rows')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('term_id', termId);
    if (countError) throw countError;
    if (!count) break;
    if (attempt >= 2) throw new Error(`Could not clear existing term rows for group ${groupId} (${count} still remain after 3 attempts)`);
  }
  if (rows.length) {
    const { error } = await supabase.from('term_rows').insert(rows.map((r, i) => rowToDb(r, groupId, termId, i)));
    if (error) throw error;
  }
}

export async function replaceTermRows(_userId: string, groupId: string, termId: string, rows: TermRow[]): Promise<void> {
  const queueKey = `${groupId}:${termId}`;
  const prior = replaceTermRowsQueues.get(queueKey) ?? Promise.resolve();
  const run = prior.then(
    () => doReplaceTermRows(groupId, termId, rows),
    () => doReplaceTermRows(groupId, termId, rows),
  ).catch(e => { console.error('Supabase term rows replace failed:', e); });
  replaceTermRowsQueues.set(queueKey, run);
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

// Supabase is authoritative: its result replaces the local cache outright rather
// than being merged into it. The cache is only ever read when Supabase itself
// can't be reached (see the catch below) — it's a fallback for that moment, not
// a store that's trusted over the database.
export async function loadRunSheets(_userId: string): Promise<RunSheetEntry[]> {
  const gid = getLocalGroupId();
  if (!gid) return Object.values(getRunSheetsCache());
  try {
    const { data, error } = await supabase
      .from('run_sheets')
      .select('*')
      .eq('group_id', gid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const fresh: Record<string, RunSheetEntry> = {};
    for (const d of data || []) {
      const entry: RunSheetEntry = { dbId: d.id, termRowId: d.term_row_id, entry: d.data as SavedRunSheet };
      const rowId = entry.entry.row?.id;
      if (rowId) fresh[rowId] = entry;
    }
    setRunSheetsCache(fresh);
    return Object.values(fresh);
  } catch (e) {
    console.error('Supabase run sheets load failed; using localStorage cache:', e);
    return Object.values(getRunSheetsCache());
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

// Supabase is authoritative here — unlike most lib/db.ts functions, this one
// THROWS on failure instead of silently degrading, so a leader is actually told
// when a run sheet didn't save, rather than trusting a localStorage-only copy
// that's lost the moment the cache is cleared. Callers must catch this and show
// the failure. localStorage is only written after a confirmed Supabase success,
// as a read-through cache, never as the save of record.
export async function saveRunSheet(
  _userId: string,
  groupId: string,
  termRowId: string | null,
  sheet: SavedRunSheet,
  existingDbId?: string,
): Promise<string> {
  let dbId: string;
  if (existingDbId) {
    const { error } = await supabase.from('run_sheets').update({ data: sheet }).eq('id', existingDbId);
    if (error) throw new Error(`Failed to save run sheet: ${error.message}`);
    dbId = existingDbId;
  } else {
    const { data, error } = await supabase
      .from('run_sheets')
      .insert({ group_id: groupId, term_row_id: termRowId, data: sheet })
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`Failed to save run sheet: ${error.message}`);
    if (!data) throw new Error('Run sheet not returned after insert');
    dbId = data.id;
  }
  cacheRunSheet(sheet.row.id, { dbId, termRowId, entry: sheet });
  return dbId;
}

// ── Terms ─────────────────────────────────────────────────────────────────────
// Each group can have many terms; term_rows.term_id scopes sessions to exactly
// one of them, so switching terms never deletes or mixes up another term's rows.

export interface TermEntry {
  id: string;
  termName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function termFromDb(d: any): TermEntry {
  return {
    id: d.id,
    termName: d.term_name || '',
    startDate: d.start_date || '',
    endDate: d.end_date || '',
    isActive: d.is_active,
    createdAt: d.created_at,
  };
}

export async function getActiveTerm(groupId: string): Promise<TermEntry | null> {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data ? termFromDb(data) : null;
  } catch (e) {
    console.error('Supabase getActiveTerm failed:', e);
    return null;
  }
}

export async function loadTerms(groupId: string): Promise<TermEntry[]> {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(termFromDb);
  } catch (e) {
    console.error('Supabase loadTerms failed:', e);
    return [];
  }
}

// Creates a new term and makes it the active one for the group. The previously
// active term (and its rows) is left completely untouched.
export async function createTerm(
  groupId: string,
  termName: string,
  startDate: string,
  endDate: string,
): Promise<string | null> {
  try {
    const { error: deactivateError } = await supabase.from('terms').update({ is_active: false }).eq('group_id', groupId);
    if (deactivateError) throw deactivateError;
    const { data, error } = await supabase
      .from('terms')
      .insert({ group_id: groupId, term_name: termName, start_date: startDate || null, end_date: endDate || null, is_active: true })
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    console.error('Supabase createTerm failed:', e);
    return null;
  }
}

export async function setActiveTerm(groupId: string, termId: string): Promise<void> {
  try {
    const { error: deactivateError } = await supabase.from('terms').update({ is_active: false }).eq('group_id', groupId);
    if (deactivateError) throw deactivateError;
    const { error } = await supabase.from('terms').update({ is_active: true }).eq('id', termId);
    if (error) throw error;
  } catch (e) {
    console.error('Supabase setActiveTerm failed:', e);
  }
}

// Keeps a term's label (name/dates) in sync with what's shown on the page — without
// this, renaming a term or uploading a plan only updates local state, and the
// "My terms" list keeps showing whatever name the term had when it was created.
export async function updateTermMeta(termId: string, termName: string, startDate: string, endDate: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('terms')
      .update({ term_name: termName, start_date: startDate || null, end_date: endDate || null })
      .eq('id', termId);
    if (error) throw error;
  } catch (e) {
    console.error('Supabase updateTermMeta failed:', e);
  }
}
