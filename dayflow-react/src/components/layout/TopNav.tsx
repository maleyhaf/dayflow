import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import styles from './TopNav.module.css';

export default function TopNav() {
  const { state, dispatch } = useApp();

  const handleViewChange = (view: ViewMode) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  // save if toggle dark
  const handleToggleDark = () => {
    dispatch({ type: 'TOGGLE_DARK' });
    // Persist dark mode preference in localStorage so it can be loaded on next visit
    localStorage.setItem('df_isDark', String(!state.isDark));
  }

  return (
    <header className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>
        Day<span className={styles.logoAccent}>Flow</span>
      </div>

      {/* View toggle */}
      <div className={styles.viewToggle}>
        {(['week', 'month'] as ViewMode[]).map(v => (
          <button
            key={v}
            className={`${styles.viewBtn} ${state.viewMode === v ? styles.viewBtnActive : ''}`}
            onClick={() => handleViewChange(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div className={styles.right}>
        {/* GCal sync */}
        <button
          className={styles.gcalBtn}
          onClick={() => dispatch({ type: 'SET_SYNC_MODAL', payload: true })}
        >
          <span className={styles.gcalDot} />
          Google Calendar
        </button>

        {/* Dark mode */}
        <button
          className={styles.iconBtn}
          onClick={() => handleToggleDark()}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {state.isDark ? '☀' : '☽'}
        </button>

        {/* New event */}
        <button
          className={styles.newBtn}
          onClick={() => dispatch({
            type: 'OPEN_MODAL',
            payload: { mode: 'create' },
          })}
        >
          <span aria-hidden>+</span> New event
        </button>
      </div>
    </header>
  );
}
