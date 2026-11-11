import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ViewMode } from '../../types';
import styles from './TopNav.module.css';
import SettingsModal from '../ui/SettingsModal';
import Logo from '../ui/Logo';

export default function TopNav() {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();

  // account menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const displayName = meta.full_name || meta.name || user?.email || 'Account';
  const avatarUrl = meta.avatar_url || meta.picture;
  const saveLabel =
    state.saveStatus === 'saving' ? 'Saving…' :
    state.saveStatus === 'error' ? "Couldn't save – retrying" : 'Saved';

  // settings modal state
  const [setModalOpen, setSetModalOpen] = useState(false);

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
        <Logo size={30} />
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
        {/* Save status */}
        <span
          className={`${styles.saveStatus} ${state.saveStatus === 'error' ? styles.saveStatusError : ''}`}
          role="status"
        >
          {saveLabel}
        </span>

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

        {/* Settings */}
        <button
          className={styles.iconBtn}
          onClick={() => setSetModalOpen(true)}
          title="Settings"
          aria-label="Settings"
        >
          ⚙
        </button>

        {setModalOpen && (
          <SettingsModal
            onClose={() => setSetModalOpen(false)}
            onSave={ (theme) => {
              dispatch({ type: 'SET_THEME', payload: theme });
              setSetModalOpen(false);
            }}
          />
        )}

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

        {/* Account */}
        <div className={styles.account} ref={menuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            title={displayName}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
              : <span>{displayName.charAt(0).toUpperCase()}</span>}
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuUser}>
                <div className={styles.menuName}>{displayName}</div>
                {user?.email && user.email !== displayName && (
                  <div className={styles.menuEmail}>{user.email}</div>
                )}
              </div>
              <button className={styles.menuItem} role="menuitem" onClick={() => { setMenuOpen(false); signOut(); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>


    </header>
  );
}
