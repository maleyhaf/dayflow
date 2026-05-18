import React from 'react';
import { CalendarEvent } from '../../types';
import { fmtDisplayTime } from '../../utils/dateUtils';
import styles from './EventChip.module.css';

interface Props {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'week' | 'month';
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragProps?: {
    draggable: true;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd:   (e: React.DragEvent) => void;
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function EventChip({
  event, onClick, variant = 'week', style, isDragging, dragProps,
}: Props) {
  const bg = hexToRgba(event.color, 0.14);
  const totalSubtasks = event.subtasks.length;
  const doneSubtasks  = event.subtasks.filter(s => s.done).length;

  const baseClass = [
    variant === 'month' ? styles.month : styles.week,
    event.completed ? styles.completed : '',
    isDragging ? styles.dragging : '',
  ].filter(Boolean).join(' ');

  if (variant === 'month') {
    return (
      <div
        className={baseClass}
        style={{ background: bg, borderLeftColor: event.color, color: event.color, ...style }}
        onClick={onClick}
        title={event.title}
        {...dragProps}
      >
        <span className={styles.monthTitle}>{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className={baseClass}
      style={{ background: bg, borderLeftColor: event.color, color: event.color, ...style }}
      onClick={onClick}
      {...dragProps}
    >
      <div className={styles.weekTitle}
        style={{ textDecoration: event.completed ? 'line-through' : 'none' }}>
        {event.title}
      </div>
      <div className={styles.weekMeta}>
        {fmtDisplayTime(event.start)}
        {event.end && event.end !== event.start && <> – {fmtDisplayTime(event.end)}</>}
      </div>
      {totalSubtasks > 0 && (
        <div className={styles.subtaskBadge}>{doneSubtasks}/{totalSubtasks}</div>
      )}
      {event.completed && <span className={styles.completedMark}>✓</span>}
    </div>
  );
}
