import { getClient } from './supabase';
import { CalendarEvent, Category, DailyNote } from '../types';

// ─── Row mappers (app shape <-> database shape) ───────────────────────────────

export function eventToRow(e: CalendarEvent, userId: string) {
  return {
    user_id: userId,
    id: e.id,
    title: e.title,
    date: e.date,
    start_time: e.start,
    end_time: e.end,
    color: e.color,
    category: e.category,
    details: e.details ?? '',
    completed: e.completed,
    subtasks: e.subtasks ?? [],
    recurrence: e.recurrence ?? null,
    recurrence_overrides: e.recurrenceOverrides ?? null,
    gcal_id: e.gcalId,
    gcal_sync: e.gcalSync,
  };
}

export function rowToEvent(r: any): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    start: r.start_time,
    end: r.end_time,
    color: r.color,
    category: r.category,
    details: r.details ?? '',
    completed: !!r.completed,
    subtasks: r.subtasks ?? [],
    recurrence: r.recurrence ?? undefined,
    recurrenceOverrides: r.recurrence_overrides ?? undefined,
    gcalId: r.gcal_id ?? null,
    gcalSync: !!r.gcal_sync,
  };
}

export function categoryToRow(c: Category, userId: string) {
  return { user_id: userId, id: c.id, name: c.name, color: c.color, icon: c.icon };
}
export function rowToCategory(r: any): Category {
  return { id: r.id, name: r.name, color: r.color, icon: r.icon ?? '' };
}

export function noteToRow(n: DailyNote, userId: string) {
  return {
    user_id: userId,
    id: n.id,
    title: n.title,
    date: n.date,
    details: n.details ?? '',
    subtasks: n.subtasks ?? [],
    gcal_id: n.gcalId,
    gcal_sync: n.gcalSync,
  };
}
export function rowToNote(r: any): DailyNote {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    details: r.details ?? '',
    subtasks: r.subtasks ?? [],
    gcalId: r.gcal_id ?? null,
    gcalSync: !!r.gcal_sync,
  };
}

// ─── Loading ──────────────────────────────────────────────────────────────────

// PostgREST returns at most 1000 rows per request, so page through the table
async function fetchAll(table: string, userId: string): Promise<any[]> {
  const sb = getClient();
  const PAGE = 1000;
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export interface LoadedData {
  events: CalendarEvent[];
  categories: Category[];
  dailyNotes: DailyNote[];
  settings: { theme: string; isDark: boolean } | null; // null = brand-new account
}

export async function loadAll(userId: string): Promise<LoadedData> {
  const sb = getClient();
  const [events, categories, notes, settings] = await Promise.all([
    fetchAll('events', userId),
    fetchAll('categories', userId),
    fetchAll('daily_notes', userId),
    sb.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (settings.error) throw settings.error;
  return {
    events: events.map(rowToEvent),
    categories: categories.map(rowToCategory),
    dailyNotes: notes.map(rowToNote),
    settings: settings.data ? { theme: settings.data.theme, isDark: !!settings.data.is_dark } : null,
  };
}

// ─── Writing ──────────────────────────────────────────────────────────────────

export async function upsertRows(table: string, rows: object[], onConflict: string) {
  if (!rows.length) return;
  const { error } = await getClient().from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

export async function deleteRows(table: string, userId: string, ids: string[]) {
  if (!ids.length) return;
  const { error } = await getClient().from(table).delete().eq('user_id', userId).in('id', ids);
  if (error) throw error;
}
