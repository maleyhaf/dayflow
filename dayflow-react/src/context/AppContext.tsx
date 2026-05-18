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
  Category,
  ViewMode,
  EventModalState,
  ColorTheme,
} from '../types';

// ─── Default Data ──────────────────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'school',   name: 'School',          color: '#2D5BE3', icon: '📚' },
  { id: 'gym',      name: 'Gym',             color: '#10B981', icon: '💪' },
  { id: 'work',     name: 'Work',            color: '#F59E0B', icon: '💼' },
  { id: 'personal', name: 'Personal',        color: '#E85D75', icon: '✨' },
  { id: 'gcal',     name: 'Google Calendar', color: '#34A853', icon: '📅' },
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
  viewMode: ViewMode;
  currentDate: string;        // "YYYY-MM-DD" — the "anchor" date for the view
  activeFilter: string | null; // category id or null
  selectedEventId: string | null;
  modal: EventModalState;
  syncModalOpen: boolean;
  theme: ColorTheme;
  isDark: boolean;
}

// ─── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_FILTER'; payload: string | null }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'OPEN_MODAL'; payload: Omit<EventModalState, 'open'> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SYNC_MODAL'; payload: boolean }
  | { type: 'SET_THEME'; payload: ColorTheme }
  | { type: 'TOGGLE_DARK' }
  | { type: 'IMPORT_GCAL_EVENTS'; payload: CalendarEvent[] };

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
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initialState: AppState = {
    events:          loadFromStorage('df_events', DEFAULT_EVENTS),
    categories:      loadFromStorage('df_cats', DEFAULT_CATEGORIES),
    viewMode:        'week',
    currentDate:     fmt(today),
    activeFilter:    null,
    selectedEventId: null,
    modal:           { open: false, mode: 'create' },
    syncModalOpen:   false,
    theme:           'default',
    isDark:          false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist events + categories
  useEffect(() => {
    localStorage.setItem('df_events', JSON.stringify(state.events));
  }, [state.events]);

  useEffect(() => {
    localStorage.setItem('df_cats', JSON.stringify(state.categories));
  }, [state.categories]);

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

  return (
    <AppContext.Provider value={{ state, dispatch, openNewEvent, openEditEvent }}>
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
