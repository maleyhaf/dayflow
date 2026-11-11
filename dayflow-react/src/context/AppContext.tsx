import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
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
  RecurrenceOverride,
} from '../types';
import { applyThemeValue } from './theme';
import { loadAll, upsertRows, deleteRows, eventToRow, categoryToRow, noteToRow } from '../lib/db';
import { useDiffSync, SyncStatus } from '../hooks/useDiffSync';

// ─── Default Data ──────────────────────────────────────────────────────────────

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'school', name: 'School', color: '#2D5BE3', icon: '📚' },
  { id: 'gym', name: 'Gym', color: '#10B981', icon: '💪' },
  { id: 'work', name: 'Work', color: '#F59E0B', icon: '💼' },
  { id: 'personal', name: 'Personal', color: '#E85D75', icon: '✨' },
  { id: 'gcal', name: 'Google Calendar', color: '#34A853', icon: '📅' },
  { id: 'daily', name: 'Daily Notes', color: '#6366F1', icon: '📝' },
];

// New accounts start with the default categories above and nothing else.

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
  loaded: boolean;             // account data has been fetched from the database
  loadError: string | null;
  saveStatus: SyncStatus;
}

// ─── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; payload: { events: CalendarEvent[]; categories: Category[]; dailyNotes: DailyNote[]; theme?: string; isDark?: boolean } }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SET_SAVE_STATUS'; payload: SyncStatus }
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
  | { type: 'DELETE_DAILY_NOTE'; payload: string }
  | { type: 'UPSERT_RECURRENCE_OVERRIDE'; payload: { eventId: string; override: RecurrenceOverride } }
  // "All events" edit: replace the series, and drop per-occurrence overrides for the fields that were changed
  | { type: 'UPDATE_RECURRING_SERIES'; payload: { event: CalendarEvent; clearFields: string[] } };

// ─── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      const { events, categories, dailyNotes, theme, isDark } = action.payload;
      return {
        ...state,
        events, categories, dailyNotes,
        theme: theme ?? state.theme,
        isDark: isDark ?? state.isDark,
        loaded: true,
        loadError: null,
      };
    }
    case 'LOAD_ERROR':
      return { ...state, loadError: action.payload };
    case 'SET_SAVE_STATUS':
      return state.saveStatus === action.payload ? state : { ...state, saveStatus: action.payload };
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
    case 'UPSERT_RECURRENCE_OVERRIDE': {
      const { eventId, override } = action.payload;
      // ignore undefined keys so a partial update never wipes existing data
      const incoming = Object.fromEntries(
        Object.entries(override).filter(([, v]) => v !== undefined)
      ) as RecurrenceOverride;
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== eventId) return e;
          const existing = e.recurrenceOverrides ?? [];
          const prev = existing.find(o => o.instanceId === incoming.instanceId);
          const merged: RecurrenceOverride = {
            ...prev,
            ...incoming,
            ...(prev?.fullOverride || incoming.fullOverride
              ? { fullOverride: { ...prev?.fullOverride, ...incoming.fullOverride } }
              : {}),
          };
          return {
            ...e,
            recurrenceOverrides: prev
              ? existing.map(o => o.instanceId === incoming.instanceId ? merged : o)
              : [...existing, merged],
          };
        }),
      };
    }
    case 'UPDATE_RECURRING_SERIES': {
      const { event, clearFields } = action.payload;
      return {
        ...state,
        events: state.events.map(e => {
          if (e.id !== event.id) return e;
          if (!event.recurrence) return { ...event, recurrenceOverrides: undefined };
          const cleaned = (event.recurrenceOverrides ?? [])
            .map(o => {
              const next: RecurrenceOverride = { ...o };
              if (clearFields.includes('details')) delete next.details;
              if (clearFields.includes('subtasks')) delete next.subtasks;
              if (next.fullOverride) {
                const fo = { ...next.fullOverride } as Record<string, unknown>;
                clearFields.forEach(f => delete fo[f]);
                next.fullOverride = Object.keys(fo).length ? (fo as Partial<CalendarEvent>) : undefined;
              }
              return next;
            })
            // drop overrides that no longer carry anything
            .filter(o => o.excluded || o.details !== undefined || o.subtasks !== undefined
              || o.completed !== undefined || o.fullOverride !== undefined);
          return { ...event, recurrenceOverrides: cleaned };
        }),
      };
    }
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
  retryLoad: () => void;
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

export function AppProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const initialState: AppState = {
    events: [],
    categories: [],
    dailyNotes: [],
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
    loaded: false,
    loadError: null,
    saveStatus: 'saved',
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Load this user's data from the database ──────────────────────────────
  // baselines = what the database currently holds, so we only ever send changes
  const baseEvents = useRef(new Map<string, string>());
  const baseCats = useRef(new Map<string, string>());
  const baseNotes = useRef(new Map<string, string>());
  const baseSettings = useRef(new Map<string, string>());
  const [loadAttempt, setLoadAttempt] = React.useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadAll(userId);
        if (cancelled) return;
        const fill = (m: Map<string, string>, items: { id: string }[]) => {
          m.clear();
          items.forEach(i => m.set(i.id, JSON.stringify(i)));
        };
        // brand-new account: give them the default categories (saved by the sync below)
        const categories = data.settings || data.categories.length ? data.categories : DEFAULT_CATEGORIES;
        fill(baseEvents.current, data.events);
        fill(baseCats.current, data.categories);
        fill(baseNotes.current, data.dailyNotes);
        baseSettings.current.clear();
        if (data.settings) {
          baseSettings.current.set('settings', JSON.stringify({ id: 'settings', ...data.settings }));
        }
        dispatch({
          type: 'HYDRATE',
          payload: {
            events: data.events,
            categories,
            dailyNotes: data.dailyNotes,
            theme: data.settings?.theme,
            isDark: data.settings?.isDark,
          },
        });
      } catch (err: any) {
        console.error('Failed to load data', err);
        if (!cancelled) dispatch({ type: 'LOAD_ERROR', payload: err?.message ?? 'Could not load your data.' });
      }
    })();
    return () => { cancelled = true; };
  }, [userId, loadAttempt]);

  // ── Save changes back (debounced, only what changed) ─────────────────────
  const statuses = useRef<Record<string, SyncStatus>>({});
  const reportStatus = useCallback((table: string) => (s: SyncStatus) => {
    statuses.current[table] = s;
    const all = Object.values(statuses.current);
    dispatch({
      type: 'SET_SAVE_STATUS',
      payload: all.includes('error') ? 'error' : all.includes('saving') ? 'saving' : 'saved',
    });
  }, []);
  const onEventsStatus = React.useMemo(() => reportStatus('events'), [reportStatus]);
  const onCatsStatus = React.useMemo(() => reportStatus('categories'), [reportStatus]);
  const onNotesStatus = React.useMemo(() => reportStatus('notes'), [reportStatus]);
  const onSettingsStatus = React.useMemo(() => reportStatus('settings'), [reportStatus]);

  useDiffSync({
    items: state.events, ready: state.loaded, baseline: baseEvents, onStatus: onEventsStatus,
    push: async (ups, dels) => {
      await upsertRows('events', ups.map(e => eventToRow(e, userId)), 'user_id,id');
      await deleteRows('events', userId, dels);
    },
  });
  useDiffSync({
    items: state.categories, ready: state.loaded, baseline: baseCats, onStatus: onCatsStatus,
    push: async (ups, dels) => {
      await upsertRows('categories', ups.map(c => categoryToRow(c, userId)), 'user_id,id');
      await deleteRows('categories', userId, dels);
    },
  });
  useDiffSync({
    items: state.dailyNotes, ready: state.loaded, baseline: baseNotes, onStatus: onNotesStatus,
    push: async (ups, dels) => {
      await upsertRows('daily_notes', ups.map(n => noteToRow(n, userId)), 'user_id,id');
      await deleteRows('daily_notes', userId, dels);
    },
  });
  const settingsItems = React.useMemo(
    () => [{ id: 'settings', theme: state.theme, isDark: state.isDark }],
    [state.theme, state.isDark]
  );
  useDiffSync({
    items: settingsItems, ready: state.loaded, baseline: baseSettings, onStatus: onSettingsStatus,
    push: async (ups) => {
      const s = ups[0];
      if (s) await upsertRows('user_settings', [{ user_id: userId, theme: s.theme, is_dark: s.isDark }], 'user_id');
    },
  });

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

  const retryLoad = useCallback(() => {
    dispatch({ type: 'LOAD_ERROR', payload: '' });
    setLoadAttempt(n => n + 1);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, openNewEvent, openEditEvent, openDailyNote, retryLoad }}>
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
