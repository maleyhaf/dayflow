import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import './styles/globals.css';
import styles from './App.module.css';

// ─── Inner app (needs context) ─────────────────────────────────────────────────

function AppShell() {
  const { state, dispatch, openNewEvent } = useApp();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      switch (e.key) {
        case 'n': case 'N':
          openNewEvent();
          break;
        case 't': case 'T':
          dispatch({ type: 'SET_DATE', payload: new Date().toISOString().slice(0, 10) });
          break;
        case 'Escape':
          dispatch({ type: 'CLOSE_MODAL' });
          dispatch({ type: 'SET_SYNC_MODAL', payload: false });
          dispatch({ type: 'SELECT_EVENT', payload: null });
          break;
        case 'ArrowLeft':
          navigateBack();
          break;
        case 'ArrowRight':
          navigateForward();
          break;
      }
    };

    const navigateBack = () => {
      const d = new Date(state.currentDate);
      if (state.viewMode === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      dispatch({ type: 'SET_DATE', payload: d.toISOString().slice(0, 10) });
    };

    const navigateForward = () => {
      const d = new Date(state.currentDate);
      if (state.viewMode === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      dispatch({ type: 'SET_DATE', payload: d.toISOString().slice(0, 10) });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.currentDate, state.viewMode, dispatch, openNewEvent]);

  return (
    <div className={styles.app}>
      <TopNav />

      <div className={styles.body}>
        <Sidebar />

        {/* Main calendar area — populated in next step */}
        <main className={styles.main} id="calendar-main">
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🗓</div>
            <div className={styles.placeholderTitle}>Calendar coming next</div>
            <div className={styles.placeholderSub}>
              Shell is ready — week &amp; month views go here
            </div>
          </div>
        </main>

        {/* Detail panel — populated later */}
        {state.selectedEventId && (
          <aside className={styles.detail}>
            <div className={styles.placeholder} style={{ padding: 24 }}>
              <div className={styles.placeholderTitle}>Event detail panel</div>
              <div className={styles.placeholderSub}>Coming soon</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
