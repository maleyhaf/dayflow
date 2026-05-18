import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  parseDate, addDays, addMonths, getWeekStart,
  MONTH_NAMES, MONTH_SHORT, fmtDate,
} from '../../utils/dateUtils';
import styles from './CalendarHeader.module.css';

export default function CalendarHeader() {
  const { state, dispatch } = useApp();
  const anchor = parseDate(state.currentDate);
  const isWeek = state.viewMode === 'week';

  const navigate = (dir: -1 | 1) => {
    const next = isWeek ? addDays(anchor, dir * 7) : addMonths(anchor, dir);
    dispatch({ type: 'SET_DATE', payload: fmtDate(next) });
  };

  const goToday = () => {
    dispatch({ type: 'SET_DATE', payload: fmtDate(new Date()) });
  };

  // Build title string
  const title = (() => {
    if (isWeek) {
      const ws = getWeekStart(anchor);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) {
        return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
      }
      return `${MONTH_SHORT[ws.getMonth()]} ${ws.getDate()} – ${MONTH_SHORT[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`;
    }
    return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  })();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button className={styles.navBtn} onClick={() => navigate(-1)} aria-label="Previous">
          ‹
        </button>
        <button className={styles.navBtn} onClick={() => navigate(1)} aria-label="Next">
          ›
        </button>
        <h2 className={styles.title}>{title}</h2>
        <button className={styles.todayBtn} onClick={goToday}>
          Today
        </button>
      </div>

      <div className={styles.right}>
        {state.activeFilter && (
          <div className={styles.filterBadge}>
            <span
              className={styles.filterDot}
              style={{
                background: state.categories.find(c => c.id === state.activeFilter)?.color,
              }}
            />
            {state.categories.find(c => c.id === state.activeFilter)?.name}
            <button
              className={styles.filterClear}
              onClick={() => dispatch({ type: 'SET_FILTER', payload: null })}
            >
              ✕
            </button>
          </div>
        )}
        <button
          className={styles.syncStatus}
          onClick={() => dispatch({ type: 'SET_SYNC_MODAL', payload: true })}
        >
          <span className={styles.syncDot} />
          Synced
        </button>
      </div>
    </div>
  );
}
