import React, { useState, useEffect } from 'react';
import styles from './DetailPanel.module.css';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, Category, DailyNote, Subtask } from '../../types';
import { fmtDisplayTime, MONTH_SHORT } from '../../utils/dateUtils';
import { SubtaskList } from '../events/EventModal';
// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryInfo(event: CalendarEvent, categories: Category[]) {
  const cat = categories.find(c => c.id === event.category);
  return {
    name: cat?.name || 'Uncategorized',
    icon: cat?.icon || '🏷️',
    color: cat?.color || '#888',
  };
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// for selected event, show details, notes, subtasks, and allow editing
function EventDetailPanel({ state, dispatch, openEditEvent, selectedEvent }: { state: any; dispatch: any; openEditEvent: any; selectedEvent: CalendarEvent }) {

  const { categories } = state;

  const close = () => dispatch({ type: 'SELECT_EVENT', payload: null });
  const [notes, setNotes] = useState(selectedEvent?.details ?? '');
  const [subtasks, setSubtasks] = useState(selectedEvent?.subtasks ?? []);

  // Sync local state when selected event changes
  useEffect(() => {
    setNotes(selectedEvent?.details ?? '');
    setSubtasks(selectedEvent?.subtasks.map(s => ({ ...s })) ?? []);
  }, [state.selectedEventId, selectedEvent]);

  const saveChanges = (updatedNotes: string, updatedSubtasks: typeof subtasks) => {
    if (!selectedEvent) return;
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...selectedEvent, details: updatedNotes, subtasks: updatedSubtasks },
    });
  };


  const cat = getCategoryInfo(selectedEvent, categories);
  //const doneCount = selectedEvent.subtasks.filter(s => s.done).length;

  return (
    <aside className={styles.detail}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={styles.header}
        style={{ borderBottom: `3px solid ${selectedEvent.color}` }}
      >
        <div
          className={styles.colorSwatch}
          style={{
            background: hexToRgba(selectedEvent.color, 0.15),
            borderColor: selectedEvent.color,
          }}
        >
          <div
            className={styles.colorSwatchInner}
            style={{ background: selectedEvent.color }}
          />
        </div>

        <div className={styles.headerText}>

          <div className={styles.eventTitle} style={{ textDecoration: selectedEvent.completed ? 'line-through' : 'none' }}>
            {selectedEvent.title}
            {selectedEvent.completed && <span className={styles.completedMark} style={{ color: selectedEvent.color }}>
              ✓
            </span>}
          </div>

          <div className={styles.categoryBadge} style={{ background: hexToRgba(cat.color, 0.30) }}>
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </div>

        </div>


      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className={styles.body}>



        {/* Date + time */}
        <div className={styles.section}>
          <div className={styles.label}>When</div>
          <div className={styles.metaRow}>
            <div className={styles.metaChip}>
              <span className={styles.metaChipIcon}>📅</span>
              {formatDate(selectedEvent.date)}
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaChipIcon}>🕐</span>
              {fmtDisplayTime(selectedEvent.start)}
              {selectedEvent.end && <> – {fmtDisplayTime(selectedEvent.end)}</>}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className={styles.section}>
          <div className={styles.label}>Notes</div>
          <textarea
            className={styles.notes}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => saveChanges(notes, subtasks)}
            placeholder="Add notes, links, anything…"
            rows={3}
          />
        </div>

        {/* Subtasks */}
        {
          <div className={styles.section}>
            <div className={styles.label}>
              Subtasks
              {subtasks.length > 0 && (
                <span className={styles.subtaskProgress}>
                  {' '}{subtasks.filter(s => s.done).length}/{subtasks.length}
                </span>
              )}
            </div>
            <SubtaskList
              subtasks={subtasks}
              onChange={updated => {
                setSubtasks(updated);
                saveChanges(notes, updated);
              }}
            />
          </div>
        }




      </div>



      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>

        <button
          className={`${styles.completeBtn} ${selectedEvent.completed ? styles.completeBtnDone : ''}`}
          onClick={() => {
            dispatch({
              type: 'UPDATE_EVENT',
              payload: { ...selectedEvent, completed: !selectedEvent.completed },
            });
          }}
        >
          {selectedEvent.completed ? '✓' : 'Done'}
        </button>

        <button
          className={styles.editBtn}
          style={{ background: selectedEvent.color, marginLeft: 'auto' }}
          onClick={() => openEditEvent(selectedEvent)}
        >
          Edit
        </button>



        <button className={styles.closeFooterBtn} onClick={close}>
          ✕
        </button>
      </div>

    </aside>
  );

}

// for selected daily note, show details, subtasks, and allow editing
function DailyNoteDetailPanel({ dailyNote, isToday }: { dailyNote: DailyNote; isToday: boolean | null }) {
  const { dispatch } = useApp();

  const [notes, setNotes] = useState(dailyNote.details ?? '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(dailyNote.subtasks.map(s => ({ ...s })));
  // Sync when the selected note changes
  useEffect(() => {
    setNotes(dailyNote.details ?? '');
    setSubtasks(dailyNote.subtasks.map(s => ({ ...s })));
  }, [dailyNote.id, dailyNote.details, dailyNote.subtasks]);

  const close = () => dispatch({ type: 'SELECT_DAILY_NOTE', payload: null });

  const saveChanges = (updatedNotes: string, updatedSubtasks: typeof subtasks) => {
    dispatch({
      type: 'UPSERT_DAILY_NOTE',
      payload: { ...dailyNote, details: updatedNotes, subtasks: updatedSubtasks },
    });
  };

  return (
    <aside className={styles.detail}>

      {/* Header */}
      <div className={styles.header} style={{ borderBottom: '3px solid var(--accent)' }}>
        <div className={styles.headerText}>
          <div className={styles.eventTitle}>📝 {formatDate(dailyNote.date)}</div>
          <div className={styles.categoryBadge}>
            {isToday ? 'Today - Daily Notes' : 'Daily Notes'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>

        <div className={styles.section}>
          <div className={styles.label}>Notes</div>
          <textarea
            className={styles.notes}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => saveChanges(notes, subtasks)}
            placeholder="Write anything about today…"
            rows={4}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.label}>
            Tasks
            {subtasks.length > 0 && (
              <span className={styles.subtaskProgress}>
                {' '}{subtasks.filter(s => s.done).length}/{subtasks.length}
              </span>
            )}
          </div>
          <SubtaskList
            subtasks={subtasks}
            onChange={updated => {
              setSubtasks(updated);
              saveChanges(notes, updated);
            }}
          />
        </div>

      </div>

      {/* Footer — just close, no edit button */}
      <div className={styles.footer}>
        <button className={styles.closeFooterBtn} style={{ marginLeft: 'auto' }} onClick={close}>
          ✕
        </button>
      </div>

    </aside>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────────

export default function DetailPanel() {
  const { state, dispatch, openEditEvent } = useApp();

  const selectedEvent = state.events.find(e => e.id === state.selectedEventId);
  const selectedDailyNote = selectedEvent ? null : state.dailyNotes.find(dn => dn.date === state.selectedDate);

  if (selectedEvent) {
    return <EventDetailPanel state={state} dispatch={dispatch} openEditEvent={openEditEvent} selectedEvent={selectedEvent} />;
  } else if (selectedDailyNote) {
    const isToday = state.selectedDateIsToday;
    return <DailyNoteDetailPanel dailyNote={selectedDailyNote} isToday={isToday} />;
  } else {
    return (
      <aside className={styles.detail}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗓</div>
          <div className={styles.emptyText}>Select an event or daily note to see details</div>
        </div>
      </aside>
    );
  }


}
