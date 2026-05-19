import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ThemePreset, ColorTheme } from '../../types';
import { PRESETS, applyThemeValue } from '../../context/theme';
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
  const [catModalOpen, setCatModalOpen] = useState(false);

  const handleFilter = (id: string) => {
    dispatch({
      type: 'SET_FILTER',
      payload: state.activeFilter === id ? null : id,
    });
  };

  /*
  OLD VERSION
  const handleAdd = () => {
    // get user input category name, icon and color
    const name = window.prompt('Category name:');
    if (!name?.trim()) return;
    const colors = ['#8B5CF6', '#F43F5E', '#06B6D4', '#F59E0B', '#10B981'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newCat: Category = {
      id: 'cat_' + Date.now(),
      name: name.trim(),
      color,
      icon: '🏷️',
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCat });
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
            onClick={() => handleFilter(cat.id)}
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
      <button className={styles.addCatBtn} onClick={() => setCatModalOpen(true)}>
        + Add category
      </button>

      {catModalOpen && (
        <CategoryModal
          onClose={() => setCatModalOpen(false)}
          onSave={(cat) => {
            dispatch({ type: 'ADD_CATEGORY', payload: cat });
            setCatModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Palette ───────────────────────────────────────────────────────────────────



function PalettePanel() {
  const { state, dispatch } = useApp();
  const [hexValue, setHexValue] = useState('');
  const [hexError, setHexError] = useState(false);

  const handlePreset = (key: ColorTheme) => {
    dispatch({ type: 'SET_THEME', payload: key });
    // apply immediately for snappy feedback; AppContext will also apply and persist
    applyThemeValue(key, state.isDark);
  };

  const handleApplyHex = () => {
    const val = hexValue.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHexError(false);
      dispatch({ type: 'SET_THEME', payload: val });
      applyThemeValue(val, state.isDark);
    } else {
      setHexError(true);
      setTimeout(() => setHexError(false), 1200);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>Color theme</div>
      {(Object.entries(PRESETS) as [ColorTheme, ThemePreset][]).map(([key, preset]) => (
        <button
          key={key}
          className={`${styles.presetBtn} ${state.theme === key ? styles.presetBtnActive : ''}`}
          onClick={() => handlePreset(key)}
        >
          <div className={styles.presetDots}>
            {preset.dots.map((c, i) => (
              <span key={i} className={styles.presetDot} style={{ background: c }} />
            ))}
          </div>
          {preset.label}
        </button>
      ))}

      <div className={styles.sectionLabel} style={{ marginTop: 12 }}>Custom accent</div>
      <div className={styles.hexRow}>
        <input
          className={`${styles.hexInput} ${hexError ? styles.hexInputError : ''}`}
          placeholder="#2D5BE3"
          maxLength={7}
          value={hexValue}
          onChange={e => setHexValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleApplyHex()}
        />
        <button className={styles.hexApply} onClick={handleApplyHex}>
          Apply
        </button>
      </div>
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
      <PalettePanel />
      <div className={styles.divider} />
      <ShortcutsPanel />
    </aside>
  );
}
