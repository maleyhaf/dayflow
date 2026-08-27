import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, Subtask } from '../../types';
import { fmtDate } from '../../utils/dateUtils';
import styles from './EventModal.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLORS = [
  '#2D5BE3', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#F43F5E', '#E85D75', '#F4A261', '#F59E0B', '#E9C46A',
  '#10B981', '#52B788', '#06B6D4', '#14B8A6', '#34A853',
];

function uid() {
  return 'sub_' + Math.random().toString(36).slice(2, 9);
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className={styles.colorGrid}>
      {EVENT_COLORS.map(c => (
        <button
          key={c}
          className={`${styles.colorDot} ${c === value ? styles.colorDotSelected : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={c}
          type="button"
        />
      ))}
    </div>
  );
}

function SubtaskList({
  subtasks,
  onChange,
}: {
  subtasks: Subtask[];
  onChange: (s: Subtask[]) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toggle = (id: string) =>
    onChange(subtasks.map(s => (s.id === id ? { ...s, done: !s.done } : s)));

  const update = (id: string, text: string) =>
    onChange(subtasks.map(s => (s.id === id ? { ...s, text } : s)));

  const remove = (id: string) =>
    onChange(subtasks.filter(s => s.id !== id));

  const add = () => {
    const newSub: Subtask = { id: uid(), text: '', done: false };
    onChange([...subtasks, newSub]);
    // Focus the new input after render
    setTimeout(() => {
      const last = inputRefs.current[subtasks.length];
      last?.focus();
    }, 30);
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
    if (e.key === 'Backspace' && subtasks[idx].text === '') {
      e.preventDefault();
      remove(subtasks[idx].id);
      setTimeout(() => inputRefs.current[idx - 1]?.focus(), 30);
    }
  };

  return (
    <div className={styles.subtaskList}>
      {subtasks.map((s, i) => (
        <div key={s.id} className={styles.subtaskRow}>
          <button
            type="button"
            className={`${styles.subtaskCheck} ${s.done ? styles.subtaskCheckDone : ''}`}
            onClick={() => toggle(s.id)}
            aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
          >
            {s.done && <span className={styles.checkmark}>✓</span>}
          </button>
          <input
            ref={el => { inputRefs.current[i] = el; }}
            className={`${styles.subtaskInput} ${s.done ? styles.subtaskInputDone : ''}`}
            value={s.text}
            onChange={e => update(s.id, e.target.value)}
            onKeyDown={e => handleKeyDown(e, i)}
            placeholder="Subtask…"
          />
          <button
            type="button"
            className={styles.subtaskRemove}
            onClick={() => remove(s.id)}
            aria-label="Remove subtask"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className={styles.addSubtaskBtn} onClick={add}>
        <span className={styles.addSubtaskPlus}>+</span> Add subtask
      </button>
    </div>
  );
}

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = categories.find(c => c.id === value);
  const selectedIndex = categories.findIndex(c => c.id === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  function openDropdown() {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(id: string) {
    onChange(id);
    setOpen(false);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDropdown();
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(i => Math.min(i + 1, categories.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) selectOption(categories[highlightedIndex].id);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div className={styles.catSelectWrapper} ref={wrapperRef}>
      {selected && (
        <span className={styles.catSelectDot} style={{ background: selected.color }} />
      )}

      <button
        type="button"
        className={styles.select}
        style={{ paddingLeft: selected ? 28 : 10, textAlign: 'left', width: '100%' }}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? `${selected.icon} ${selected.name}` : 'Select category'}
      </button>

      {open && (
        <ul
          className={styles.catSelectList}
          role="listbox"
          ref={listRef}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {categories.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={c.id === value}
              className={[
                styles.catSelectOption,
                i === highlightedIndex ? styles.catSelectOptionHighlighted : '',
                c.id === value ? styles.catSelectOptionSelected : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => setHighlightedIndex(i)}
              onClick={() => selectOption(c.id)}
            >
              <span className={styles.catSelectOptionDot} style={{ background: c.color }} />
              <span>{c.icon} {c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function EventModal() {
  const { state, dispatch } = useApp();
  const { modal, categories } = state;

  const isEdit = modal.mode === 'edit' && !!modal.editingEvent;
  const existing = modal.editingEvent;

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(EVENT_COLORS[4]);
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [completed, setCompleted] = useState(false);
  const [gcalSync, setGcalSync] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [titleError, setTitleError] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Populate form when modal opens
  useEffect(() => {
    if (!modal.open) return;

    if (isEdit && existing) {
      setTitle(existing.title);
      setDate(existing.date);
      setStartTime(existing.start);
      setEndTime(existing.end);
      setColor(existing.color);
      setCategory(existing.category);
      setDetails(existing.details);
      setCompleted(existing.completed);
      setGcalSync(existing.gcalSync);
      setSubtasks(existing.subtasks.map(s => ({ ...s })));
    } else {
      setTitle('');
      setDate(modal.defaultDate ?? fmtDate(new Date()));
      setStartTime(modal.defaultTime ?? '09:00');
      setEndTime(bumpHour(modal.defaultTime ?? '09:00'));
      setColor(categories[0]?.color ?? EVENT_COLORS[4]);
      setCategory(categories[0]?.id ?? '');
      setDetails('');
      setCompleted(false);
      setGcalSync(true);
      setSubtasks([]);
    }
    setTitleError(false);

    setTimeout(() => titleRef.current?.focus(), 60);
  }, [modal.open, modal.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, [dispatch]);


  const handleSaveRef = useRef<() => void>(() => { });
  // Keep the ref updated on every render
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Close and save on Escape
  useEffect(() => {
    if (!modal.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEdit) handleSaveRef.current();
        else close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal.open, isEdit, close]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) close();
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }

    const ev: CalendarEvent = {
      id: existing?.id ?? ('ev_' + Math.random().toString(36).slice(2, 9)),
      title: title.trim(),
      date,
      start: startTime,
      end: endTime,
      color,
      category,
      details,
      completed,
      subtasks,
      gcalSync,
      gcalId: existing?.gcalId ?? null,
    };

    if (isEdit) {
      dispatch({ type: 'UPDATE_EVENT', payload: ev });
      // Keep this event selected so detail panel refreshes
      dispatch({ type: 'SELECT_EVENT', payload: ev.id });
    } else {
      dispatch({ type: 'ADD_EVENT', payload: ev });
      dispatch({ type: 'SELECT_EVENT', payload: ev.id });
    }

    close();
  };

  const handleDelete = () => {
    if (!existing) return;
    if (!window.confirm('Delete this event?')) return;
    dispatch({ type: 'DELETE_EVENT', payload: existing.id });
    close();
  };

  if (!modal.open) return null;

  const cat = categories.find(c => c.id === category);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className={styles.header} style={{ borderBottom: `3px solid ${color}` }}>
          <div
            className={styles.colorSwatch}
            style={{ background: hexToRgba(color, 0.18), borderColor: color }}
            title="Pick a color below"
          >
            <div className={styles.colorSwatchInner} style={{ background: color }} />
          </div>
          <input
            ref={titleRef}
            className={`${styles.titleInput} ${titleError ? styles.titleInputError : ''}`}
            value={title}
            onChange={e => { setTitle(e.target.value); setTitleError(false); }}
            placeholder="Event title…"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button className={styles.closeBtn} onClick={close} aria-label="Close">✕</button>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className={styles.body}>

          {/* Row: date + time */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Start</label>
              <input
                type="time"
                className={styles.input}
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End</label>
              <input
                type="time"
                className={styles.input}
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Row: category */}
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <CategorySelect
              categories={categories}
              value={category}
              onChange={id => {
                setCategory(id);
                setColor(categories.find(c => c.id === id)?.color ?? EVENT_COLORS[4]);
              }}
            />
          </div>

          {/* Color picker */}
          <div className={styles.field}>
            <label className={styles.label}>Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {/* Details */}
          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Add notes, links, anything…"
              rows={3}
            />
          </div>

          {/* Subtasks */}
          <div className={styles.field}>
            <label className={styles.label}>Subtasks</label>
            <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
          </div>

          {/* Completed toggle + GCal sync */}
          <div className={styles.toggleRow}>
            <button
              type="button"
              className={`${styles.completeToggle} ${completed ? styles.completeToggleDone : ''}`}
              onClick={() => setCompleted(v => !v)}
            >
              <span className={styles.completeIcon}>{completed ? '✓' : '○'}</span>
              {completed ? 'Completed' : 'Mark complete'}
            </button>

            <label className={styles.syncToggle}>
              <input
                type="checkbox"
                checked={gcalSync}
                onChange={e => setGcalSync(e.target.checked)}
                className={styles.syncCheckbox}
              />
              Sync to Google Calendar
            </label>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className={styles.footer}>
          {isEdit && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <div className={styles.footerRight}>
            <button type="button" className={styles.cancelBtn} onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              style={{ background: color }}
            >
              {isEdit ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bumpHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
