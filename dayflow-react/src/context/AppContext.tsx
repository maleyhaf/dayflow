import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  CalendarEvent,
  DailyNote,
  Category,
  ViewMode,
  EventModalState,
  CategoryModalState,
  SettingsModalState,
} from '../types';
import { applyThemeValue } from './theme';

// ─── Default Data ──────────────────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'school', name: 'School', color: '#2D5BE3', icon: '📚' },
  { id: 'gym', name: 'Gym', color: '#10B981', icon: '💪' },
  { id: 'work', name: 'Work', color: '#F59E0B', icon: '💼' },
  { id: 'personal', name: 'Personal', color: '#E85D75', icon: '✨' },
  { id: 'gcal', name: 'Google Calendar', color: '#34A853', icon: '📅' },
  { id: 'daily', name: 'Daily Notes', color: '#6366F1', icon: '📝' },
];

const DEFAULT_DAILY_NOTES: DailyNote[] = [
  {
    id: 'd1', title: fmt(today),
    date: fmt(today),
    details: 'This is a daily note for today.',
    subtasks: [], gcalId: null, gcalSync: false,
  },
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'e1', title: 'CMPUT 301 Lecture', category: 'school', color: '#2D5BE3',
    date: fmt(today), start: '09:00', end: '10:00',
    details: 'Chapter 4 — OOP patterns. Bring laptop.',
    completed: false,
    subtasks: [
      { id: 's1', text: 'Review slides', done: false },
      { id: 's2', text: 'Do practice problems', done: true },
    ],
    gcalId: null, gcalSync: false,
  },
  {
    id: 'e2', title: 'Morning Run', category: 'gym', color: '#10B981',
    date: fmt(today), start: '07:00', end: '08:00',
    details: '5km route through Hawrelak Park',
    completed: true, subtasks: [], gcalId: null, gcalSync: false,
  },
  {
    id: 'e3', title: 'STAT 252 Assignment', category: 'school', color: '#6366F1',
    date: fmt(addDays(today, 1)), start: '14:00', end: '16:00',
    details: 'Assignment 3 due Friday', completed: false,
    subtasks: [
      { id: 's3', text: 'Q1–Q5', done: false },
      { id: 's4', text: 'Q6–Q10', done: false },
    ],
    gcalId: null, gcalSync: false,
  },
  {
    id: 'e4', title: 'Grocery run', category: 'personal', color: '#E85D75',
    date: fmt(addDays(today, 2)), start: '11:00', end: '12:00',
    details: '', completed: false, subtasks: [], gcalId: null, gcalSync: false,
  },
];

// ─── State Shape ───────────────────────────────────────────────────────────────

interface AppState {
  events: CalendarEvent[];
  categories: Category[];
  dailyNotes: DailyNote[];
  viewMode: ViewMode;
  currentDate: string;        // "YYYY-MM-DD" — the "anchor" date for the view
  activeFilter: string | null; // category id or null
  selectedEventId: string | null;
  selectedDate: string | null;
  selectedDateIsToday: boolean | null;
  modal: EventModalState;
  categoryModal: CategoryModalState;
  syncModalOpen: boolean;
  theme: string;
  isDark: boolean;
  settingsModal: SettingsModalState;
  draggingEventId: string | null;
}

// ─── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_FILTER'; payload: string | null }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SELECT_DAILY_NOTE'; payload: { date: string; today: boolean } | null }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'EDIT_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'OPEN_CATEGORY_MODAL'; payload: Omit<CategoryModalState, 'open'> }
  | { type: 'CLOSE_CATEGORY_MODAL' }
  | { type: 'OPEN_MODAL'; payload: Omit<EventModalState, 'open'> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SYNC_MODAL'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'TOGGLE_DARK' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'IMPORT_GCAL_EVENTS'; payload: CalendarEvent[] }
  | { type: 'SET_DRAGGING'; payload: string | null }
  | { type: 'UPSERT_DAILY_NOTE'; payload: DailyNote }
  | { type: 'DELETE_DAILY_NOTE'; payload: string };

// ─── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, viewMode: action.payload };
    case 'SET_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_FILTER':
      return { ...state, activeFilter: action.payload };
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload };
    case 'SELECT_DAILY_NOTE':
      return { ...state, selectedDate: action.payload?.date || null, selectedDateIsToday: action.payload?.today || null };
    case 'UPSERT_DAILY_NOTE': {
      const exists = state.dailyNotes.find(n => n.id === action.payload.id);
      return {
        ...state,
        dailyNotes: exists
          ? state.dailyNotes.map(n => n.id === action.payload.id ? action.payload : n)
          : [...state.dailyNotes, action.payload],
      };
    }
    case 'DELETE_DAILY_NOTE':
      return {
        ...state,
        dailyNotes: state.dailyNotes.filter(n => n.id !== action.payload),
        selectedDate: state.selectedDate === action.payload ? null : state.selectedDate,
        selectedDateIsToday: state.selectedDate === action.payload ? null : state.selectedDateIsToday,
      };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'EDIT_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
        // delete the events in that category
        events: state.events.map(e =>
          e.category === action.payload ? null : e
        ).filter(Boolean) as CalendarEvent[],
        // clear filter if it was the deleted category
        activeFilter: state.activeFilter === action.payload ? null : state.activeFilter,
        // clear selected event if it was in the deleted category
        selectedEventId: state.selectedEventId && state.events.find(e => e.id === state.selectedEventId)?.category === action.payload
          ? null
          : state.selectedEventId,
      };
    case 'OPEN_CATEGORY_MODAL':
      return { ...state, categoryModal: { ...action.payload, open: true } };
    case 'CLOSE_CATEGORY_MODAL':
      return { ...state, categoryModal: { open: false, mode: 'create' } };
    case 'OPEN_MODAL':
      return { ...state, modal: { ...action.payload, open: true } };
    case 'CLOSE_MODAL':
      return { ...state, modal: { open: false, mode: 'create' } };
    case 'SET_SYNC_MODAL':
      return { ...state, syncModalOpen: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_DARK':
      return { ...state, isDark: !state.isDark };
    case 'OPEN_SETTINGS':
      return { ...state, settingsModal: { open: true } };
    case 'SET_DRAGGING':
      return { ...state, draggingEventId: action.payload };
    case 'IMPORT_GCAL_EVENTS': {
      const incoming = action.payload.filter(
        ge => !state.events.some(e => e.gcalId === ge.gcalId)
      );
      return { ...state, events: [...state.events, ...incoming] };
    }
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  openNewEvent: (date?: string, time?: string) => void;
  openEditEvent: (event: CalendarEvent) => void;
  openDailyNote: (dateStr: string, today: boolean) => void;

}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      // value is not JSON - return raw string as T
      return (v as unknown) as T;
    }
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initialState: AppState = {
    events: (() => {
      const stored = loadFromStorage('df_events', DEFAULT_EVENTS);
      return Array.isArray(stored) ? stored : DEFAULT_EVENTS;
    })(),
    categories: (() => {
      const stored = loadFromStorage('df_cats', DEFAULT_CATEGORIES);
      return Array.isArray(stored) ? stored : DEFAULT_CATEGORIES;
    })(),
    dailyNotes: (() => {
      const stored = loadFromStorage('df_daily_notes', DEFAULT_DAILY_NOTES);
      return Array.isArray(stored) ? stored : DEFAULT_DAILY_NOTES;
    })(),
    viewMode: 'week',
    currentDate: fmt(today),
    activeFilter: null,
    selectedEventId: null,
    selectedDate: null,
    selectedDateIsToday: null,
    categoryModal: { open: false, mode: 'create' },
    modal: { open: false, mode: 'create' },
    syncModalOpen: false,
    theme: loadFromStorage('df_theme', 'default'),
    isDark: loadFromStorage('df_isDark', false),
    settingsModal: { open: false },
    draggingEventId: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist events + categories + daily notes
  useEffect(() => {
    localStorage.setItem('df_events', JSON.stringify(state.events));
  }, [state.events]);

  useEffect(() => {
    localStorage.setItem('df_cats', JSON.stringify(state.categories));
  }, [state.categories]);

  useEffect(() => {
    localStorage.setItem('df_daily_notes', JSON.stringify(state.dailyNotes));
  }, [state.dailyNotes]);

  // Apply dark mode — toggle body.dark class and clear any inline surface overrides
  useEffect(() => {
    if (state.isDark) {
      document.body.classList.add('dark');
      // Remove inline theme-preset overrides so body.dark CSS vars win
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--surface');
      document.documentElement.style.removeProperty('--surface2');
    } else {
      document.body.classList.remove('dark');
    }
  }, [state.isDark]);

  // Apply and persist theme (preset key or raw hex) whenever it or dark-mode changes
  useEffect(() => {
    try {
      applyThemeValue(state.theme, state.isDark);
    } catch (e) {
      // ignore
    }
    try {
      localStorage.setItem('df_theme', JSON.stringify(state.theme));
    } catch { }
  }, [state.theme, state.isDark]);

  // Persist dark-mode preference
  useEffect(() => {
    try { localStorage.setItem('df_isDark', JSON.stringify(state.isDark)); } catch { }
  }, [state.isDark]);


  const openNewEvent = useCallback((date?: string, time?: string) => {
    dispatch({
      type: 'OPEN_MODAL',
      payload: {
        mode: 'create',
        defaultDate: date ?? fmt(today),
        defaultTime: time ?? '09:00',
      },
    });
  }, []);

  const openEditEvent = useCallback((event: CalendarEvent) => {
    dispatch({
      type: 'OPEN_MODAL',
      payload: { mode: 'edit', editingEvent: event },
    });
  }, []);

  const openDailyNote = useCallback((dateStr: string, today: boolean) => {
    // close event if open
    dispatch({ type: 'SELECT_EVENT', payload: null });

    // find existing daily note for that date, or select by date string as the id
    const dateNote = state.dailyNotes.find(n => n.date === dateStr);
    if (dateNote) {
      dispatch({ type: 'SELECT_DAILY_NOTE', payload: { date: dateNote.date, today } });
    } else {
      // create one on the fly
      const newNote = {
        id: 'dn_' + dateStr,
        title: dateStr,
        date: dateStr,
        details: '',
        subtasks: [],
        gcalId: null,
        gcalSync: false,
      };
      dispatch({ type: 'UPSERT_DAILY_NOTE', payload: newNote });
      dispatch({ type: 'SELECT_DAILY_NOTE', payload: { date: newNote.date, today } });
    }
  }, [state.dailyNotes]);

  return (
    <AppContext.Provider value={{ state, dispatch, openNewEvent, openEditEvent, openDailyNote }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
