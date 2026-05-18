// ─── Formatting ───────────────────────────────────────────────────────────────

// Local time function for Calgary
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
