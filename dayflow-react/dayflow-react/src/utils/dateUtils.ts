import { CalendarEvent } from '../types';

// ─── Formatting ───────────────────────────────────────────────────────────────

// Local time function corrected
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

export function fmtTime(h: number, m: number = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtHourLabel(h: number): string {
  if (h === 0) return '';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export function fmtDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function getWeekStart(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay()); // Sunday
  return r;
}

export function getWeekDays(anchorDate: Date): Date[] {
  const start = getWeekStart(anchorDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Recurrence functions

// "ev_abc_2026-01-13" -> { baseId: "ev_abc", date: "2026-01-13" }; plain ids -> date null
export function splitInstanceId(id: string): { baseId: string; date: string | null } {
  const m = id.match(/^(.*)_(\d{4}-\d{2}-\d{2})$/);
  return m ? { baseId: m[1], date: m[2] } : { baseId: id, date: null };
}

// whole days from a to b (both "YYYY-MM-DD"), DST-safe
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// Build one occurrence of a recurring event, applying that occurrence's own overrides
function buildInstance(event: CalendarEvent, dateStr: string): CalendarEvent {
  const instanceId = `${event.id}_${dateStr}`;
  const override = event.recurrenceOverrides?.find(o => o.instanceId === instanceId);
  return {
    ...event,
    ...(override?.fullOverride ?? {}),
    id: instanceId,
    date: override?.fullOverride?.date ?? dateStr,
    details: override?.details ?? event.details,
    subtasks: override?.subtasks
      ? override.subtasks
      : event.subtasks.map(s => ({ ...s, done: false })),
    completed: override?.completed ?? false,
  };
}

// Find an event OR a single occurrence of a recurring event by id
export function resolveEventById(events: CalendarEvent[], id: string | null): CalendarEvent | undefined {
  if (!id) return undefined;
  const direct = events.find(e => e.id === id);
  if (direct) return direct;
  const { baseId, date } = splitInstanceId(id);
  if (!date) return undefined;
  const parent = events.find(e => e.id === baseId);
  if (!parent || !parent.recurrence) return undefined;
  if (parent.recurrenceOverrides?.find(o => o.instanceId === id)?.excluded) return undefined;
  return buildInstance(parent, date);
}

export function generateRecurringInstances(
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  if (!event.recurrence) return [event];

  const { frequency, interval, endDate, endsAfter, daysOfWeek } = event.recurrence;
  const instances: CalendarEvent[] = [];
  let current = parseDate(event.date);
  const rangeEndDate = parseDate(rangeEnd);
  const endsOnDate = endDate ? parseDate(endDate) : null;
  const overrides = event.recurrenceOverrides ?? [];

  // Scan far enough to find occurrences that were moved INTO this range from a later date
  let scanEnd = rangeEndDate;
  overrides.forEach(o => {
    if (o.fullOverride?.date) {
      const orig = parseDate(o.date);
      if (orig > scanEnd) scanEnd = orig;
    }
  });

  let occurrences = 0; // every valid slot in the series (incl. deleted/moved ones)
  let iterations = 0;

  // Safety cap
  while (current <= scanEnd && iterations < 500) {
    if (endsOnDate && current > endsOnDate) break;
    if (endsAfter !== undefined && occurrences >= endsAfter) break;

    // For weekly with specific days, check if current day is in the allowed set
    const dayMatches = !daysOfWeek || daysOfWeek.includes(current.getDay());

    if (dayMatches) {
      occurrences++;
      const dateStr = fmtDate(current);
      const override = overrides.find(o => o.instanceId === `${event.id}_${dateStr}`);
      if (!override?.excluded) {
        const inst = buildInstance(event, dateStr);
        // filter on the EFFECTIVE date (an occurrence may have been moved)
        if (inst.date >= rangeStart && inst.date <= rangeEnd) instances.push(inst);
      }
    }

    // Advance by interval
    const next = new Date(current);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + interval);
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 1) {
          next.setDate(next.getDate() + 1);
        } else {
          next.setDate(next.getDate() + (interval * 7));
        }
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + interval);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + interval);
        break;
    }
    current = next;
    iterations++;
  }
  return instances;
}

// ─── Comparisons ──────────────────────────────────────────────────────────────

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

export interface MonthCell {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthCells(year: number, month: number): MonthCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const total = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const todayStr = fmtDate(new Date());

  const cells: MonthCell[] = [];
  for (let i = 0; i < total; i++) {
    let date: Date;
    let isCurrentMonth = true;
    if (i < firstDow) {
      date = new Date(year, month - 1, prevMonthDays - firstDow + i + 1);
      isCurrentMonth = false;
    } else if (i < firstDow + daysInMonth) {
      date = new Date(year, month, i - firstDow + 1);
    } else {
      date = new Date(year, month + 1, i - firstDow - daysInMonth + 1);
      isCurrentMonth = false;
    }
    const dateStr = fmtDate(date);
    cells.push({ date, dateStr, isCurrentMonth, isToday: dateStr === todayStr });
  }
  return cells;
}

// ─── Event Positioning (week view) ────────────────────────────────────────────

export const SLOT_HEIGHT = 48; // px per hour
export const HEADER_HEIGHT = 56; // px for day-name header row

export function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h + m / 60) * SLOT_HEIGHT;
}

export function timeDurationPx(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const duration = (eh + em / 60) - (sh + sm / 60);
  return Math.max(duration * SLOT_HEIGHT, 22); // minimum 22px
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
