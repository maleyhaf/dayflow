import React from 'react';
import { CalendarEvent } from '../../types';
import { fmtDisplayTime } from '../../utils/dateUtils';
import styles from './EventChip.module.css';

interface Props {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  /** 'week' renders tall with time label; 'month' renders compact single-line */
  variant?: 'week' | 'month';
  style?: React.CSSProperties;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function EventChip({ event, onClick, variant = 'week', style }: Props) {
  const bg = hexToRgba(event.color, 0.13);
  const completedSubtasks = event.subtasks.filter(s => s.done).length;
  const totalSubtasks = event.subtasks.length;

  if (variant === 'month') {
    return (
      <div
        className={`${styles.month} ${event.completed ? styles.completed : ''}`}
        style={{
          background: bg,
          borderLeftColor: event.color,
          color: event.color,
          ...style,
        }}
        onClick={onClick}
        title={event.title}
      >
        <span className={styles.monthTitle}>{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.week} ${event.completed ? styles.completed : ''}`}
      style={{
        background: bg,
        borderLeftColor: event.color,
        color: event.color,
        ...style,
      }}
      onClick={onClick}
    >
      <div
        className={styles.weekTitle}
        style={{ textDecoration: event.completed ? 'line-through' : 'none' }}
      >
        {event.title}
      </div>

      {/* Show time if tall enough (handled by parent height) */}
      <div className={styles.weekMeta}>
        {fmtDisplayTime(event.start)}
        {event.end && event.end !== event.start && (
          <> – {fmtDisplayTime(event.end)}</>
        )}
      </div>

      {/* Subtask progress */}
      {totalSubtasks > 0 && (
        <div className={styles.subtaskBadge}>
          {completedSubtasks}/{totalSubtasks}
        </div>
      )}

      {/* Completion checkmark */}
      {event.completed && (
        <span className={styles.completedMark}>✓</span>
      )}
    </div>
  );
}
