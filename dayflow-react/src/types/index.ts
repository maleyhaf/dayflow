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
  end: string;         // "HH:MM"
  color: string;       // hex
  category: string;    // category id
  details: string;
  completed: boolean;
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
