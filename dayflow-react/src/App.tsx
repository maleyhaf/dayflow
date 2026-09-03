import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import CalendarView from './components/calendar/CalendarView';
import EventModal from './components/events/EventModal';
import DetailPanel from './components/ui/DetailPanel';
import { fmtDate, addDays, addMonths } from './utils/dateUtils';
import './styles/globals.css';
import styles from './App.module.css';

function AppShell() {
  const { state, dispatch, openNewEvent, openDailyNote } = useApp();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      switch (e.key) {
        case 'n': case 'N':
          openNewEvent();
          break;
        case 't': case 'T': {
          const todayStr = fmtDate(new Date());
          dispatch({ type: 'SET_DATE', payload: todayStr });
          
          // use the convient helper from app context to open the daily note for today
          openDailyNote(todayStr, true);
          break;
        }
        case 'Escape':
          dispatch({ type: 'CLOSE_MODAL' });
          dispatch({ type: 'SET_SYNC_MODAL', payload: false });
          dispatch({ type: 'SELECT_EVENT', payload: null });
          dispatch({ type: 'SELECT_DAILY_NOTE', payload: null });
          break;
        case 'ArrowLeft': {
          const d = new Date(state.currentDate);
          const next = state.viewMode === 'week' ? addDays(d, -7) : addMonths(d, -1);
          dispatch({ type: 'SET_DATE', payload: fmtDate(next) });
          break;
        }
        case 'ArrowRight': {
          const d = new Date(state.currentDate);
          const next = state.viewMode === 'week' ? addDays(d, 7) : addMonths(d, 1);
          dispatch({ type: 'SET_DATE', payload: fmtDate(next) });
          break;
        }
        case 'W': case 'w': {
          dispatch({ type: 'SET_VIEW', payload: 'week' });
          break;
        }
        case 'M': case 'm': {
          dispatch({ type: 'SET_VIEW', payload: 'month' });
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.currentDate, state.viewMode, dispatch, openNewEvent, openDailyNote, state.dailyNotes]);

  return (
    <div className={styles.app}>
      <TopNav />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <CalendarView />
        </main>
        {state.selectedEventId ? (
          <DetailPanel />
        ) : state.selectedDate? (
          <DetailPanel />
        ) : null}
      </div>

      {/* Modal renders above everything */}
      <EventModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
