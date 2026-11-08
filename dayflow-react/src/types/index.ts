// ─── Event & Category Types ────────────────────────────────────────────────────

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // "YYYY-MM-DD"
  start: string;       // "HH:MM"
  end: string ;         // "HH:MM"
  color: string;       // hex
  category: string;    // category id
  details: string;
  completed: boolean;
  subtasks: Subtask[];
  recurrence?: RecurrenceRule; // optional recurrence rule
  recurrenceId?: string; // optional recurrence id for instances of recurring events
  recurrenceOverrides?: RecurrenceOverride[];
  gcalId: string | null;
  gcalSync: boolean;
}

// for the daily notes
export interface DailyNote {
  id: string;
  title: string;
  date: string;        // "YYYY-MM-DD"
  details: string;
  subtasks: Subtask[];
  gcalId: string | null;
  gcalSync: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;       // hex
  icon: string;        // emoji
}

export type CategoryMode = 'create' | 'edit';
export interface CategoryModalState {
  open: boolean;
  mode: CategoryMode;
  editingCategory?: Category;
}

// ─── View & UI Types ───────────────────────────────────────────────────────────

export type ViewMode = 'week' | 'month';

export type ColorTheme = 'default' | 'warm' | 'ocean' | 'forest' | 'mono';

export interface ThemePreset {
  label: string;
  accent: string;
  bg: string;
  surface: string;
  surface2: string;
  dots: [string, string, string];
}

// ─── Modal State ──────────────────────────────────────────────────────────────

export type ModalMode = 'create' | 'edit';

export interface EventModalState {
  open: boolean;
  mode: ModalMode;
  defaultDate?: string;
  defaultTime?: string;
  editingEvent?: CalendarEvent;
}

// Settings modal
export interface SettingsModalState {
  open: boolean;
  //mode: 'edit' | 'theme';
  defaultTheme?: ColorTheme;
}

// adding recurrence rule type
// this will be used to define the recurrence pattern for events
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[]; // for weekly recurrence, 0=Sunday, 1=Monday, ..., 6=Saturday
  endDate?: string; // "YYYY-MM-DD"
  endsAfter?: number; // number of occurrences
}

// override for a specific instance of a recurring event
export interface RecurrenceOverride {
  instanceId: string;   // "parentId_YYYY-MM-DD"
  date: string;         // ORIGINAL occurrence date (matches the instanceId suffix)
  excluded?: boolean;   // this occurrence was deleted / detached from the series
  details?: string;
  subtasks?: Subtask[];
  completed?: boolean;
  // if the whole instance was edited (title, time, color etc)
  fullOverride?: Partial<CalendarEvent>;
}


// ─── Google Calendar ──────────────────────────────────────────────────────────

export interface GCalEvent {
  id: string;
  title?: string;
  summary?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}
