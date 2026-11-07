import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

import styles from './Sidebar.module.css';
import CategoryModal from '../ui/CategoryModal';

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function MiniCalendar() {
  const { state, dispatch } = useApp();
  const today = new Date();

  const [miniDate, setMiniDate] = useState<Date>(() => new Date());

  const eventDates = useMemo(
    () => new Set(state.events.map(e => e.date)),
    [state.events]
  );

  const y = miniDate.getFullYear();
  const m = miniDate.getMonth();

  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const handleDayClick = (dateStr: string) => {
    dispatch({ type: 'SET_DATE', payload: dateStr });
  };

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDow) {
      cells.push({ date: new Date(y, m - 1, prevMonthDays - firstDow + i + 1), isCurrentMonth: false });
    } else if (i < firstDow + daysInMonth) {
      cells.push({ date: new Date(y, m, i - firstDow + 1), isCurrentMonth: true });
    } else {
      cells.push({ date: new Date(y, m + 1, i - firstDow - daysInMonth + 1), isCurrentMonth: false });
    }
  }

  return (
    <div className={styles.miniCal}>
      <div className={styles.miniCalHeader}>
        <span className={styles.miniCalTitle}>
          {MONTH_NAMES[m].slice(0, 3)} {y}
        </span>
        <div className={styles.miniCalNav}>
          <button onClick={() => setMiniDate(new Date(y, m - 1, 1))}>‹</button>
          <button onClick={() => setMiniDate(new Date(y, m + 1, 1))}>›</button>
        </div>
      </div>

      <div className={styles.miniGrid}>
        {DAY_LABELS.map((d, i) => (
          <span key={i} className={styles.miniDayLabel}>{d}</span>
        ))}
        {cells.map(({ date, isCurrentMonth }, i) => {
          const dateStr = fmt(date);
          const isToday = dateStr === fmt(today);
          const isSelected = dateStr === state.currentDate;
          const hasEvents = eventDates.has(dateStr);
          return (
            <button
              key={i}
              className={[
                styles.miniDay,
                !isCurrentMonth ? styles.miniDayOther : '',
                isToday ? styles.miniDayToday : '',
                isSelected && !isToday ? styles.miniDaySelected : '',
              ].join(' ')}
              onClick={() => handleDayClick(dateStr)}
            >
              {date.getDate()}
              {hasEvents && isCurrentMonth && (
                <span className={styles.miniDayDot} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category List ─────────────────────────────────────────────────────────────

function CategoryList() {
  const { state, dispatch } = useApp();

  // modal for category creation
  //const [catModalOpen, setCatModalOpen] = useState(false);


  /*const handleFilter = (id: string) => {
    dispatch({
      type: 'SET_FILTER',
      payload: state.activeFilter === id ? null : id,
    });
  };
  */


  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>Categories</div>
      {state.categories.map(cat => {
        const count = state.events.filter(e => e.category === cat.id).length;
        const active = state.activeFilter === cat.id;
        return (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${active ? styles.catBtnActive : ''}`}
            onClick={() => dispatch({ type: 'OPEN_CATEGORY_MODAL', payload: { mode: 'edit', editingCategory: cat } })}
          >
            <span
              className={styles.catDot}
              style={{ background: cat.color }}
            />
            <span className={styles.catIcon}>{cat.icon}</span>
            <span className={styles.catName}>{cat.name}</span>
            <span className={styles.catCount}>{count}</span>
          </button>
        );
      })}
      <button className={styles.addCatBtn} onClick={() => dispatch({ type: 'OPEN_CATEGORY_MODAL', payload: { mode: 'create' } })}>
        + Add category
      </button>

      {state.categoryModal.open && (
        <CategoryModal
          onClose={() => dispatch({ type: 'CLOSE_CATEGORY_MODAL' })}
          onSave={(cat) => {
            if (state.categoryModal.mode === 'edit' && state.categoryModal.editingCategory) {
              dispatch({ type: 'EDIT_CATEGORY', payload: cat });
            } else {
              dispatch({ type: 'ADD_CATEGORY', payload: cat });
            }
            dispatch({ type: 'CLOSE_CATEGORY_MODAL' });
          }}
          onDelete={() => {
            if (state.categoryModal.editingCategory) {
              dispatch({ type: 'DELETE_CATEGORY', payload: state.categoryModal.editingCategory.id });
            }
            dispatch({ type: 'CLOSE_CATEGORY_MODAL' });
          }}
        />
      )}
    </div>
  );
}


// ─── Keyboard Shortcuts ────────────────────────────────────────────────────────

function ShortcutsPanel() {
  const shortcuts = [
    { key: 'N', label: 'New event' },
    { key: 'T', label: 'Today' },
    { key: '← →', label: 'Navigate' },
    { key: 'Esc', label: 'Close' },
  ];
  return (
    <div className={styles.section} style={{ paddingBottom: 16 }}>
      <div className={styles.sectionLabel}>Shortcuts</div>
      <div className={styles.shortcuts}>
        {shortcuts.map(s => (
          <div key={s.key} className={styles.shortcutRow}>
            <kbd className={styles.kbd}>{s.key}</kbd>
            <span className={styles.shortcutLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <MiniCalendar />
      <div className={styles.divider} />
      <CategoryList />
      <div className={styles.divider} />
      <ShortcutsPanel />
    </aside>
  );
}
