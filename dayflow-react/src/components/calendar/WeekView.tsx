import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  parseDate, getWeekDays, fmtDate,
  fmtHourLabel, timeToY, timeDurationPx, SLOT_HEIGHT, DAY_SHORT,
} from '../../utils/dateUtils';
import { useDragEvent } from '../../hooks/useDragEvent';
import EventChip from './EventChip';
import styles from './WeekView.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView() {
  const { state, dispatch, openNewEvent, openEditEvent } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchor    = parseDate(state.currentDate);
  const days      = getWeekDays(anchor);
  const todayStr  = fmtDate(new Date());

  const { getChipDragProps, getWeekColDropProps } = useDragEvent();

  // Scroll to 7am on week change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * SLOT_HEIGHT - 16;
    }
  }, [state.currentDate]);

  const filtered = state.activeFilter
    ? state.events.filter(e => e.category === state.activeFilter)
    : state.events;

  const handleSlotClick = (dateStr: string, hour: number) => {
    openNewEvent(dateStr, `${String(hour).padStart(2, '0')}:00`);
  };

  const handleChipClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const ev = state.events.find(ev => ev.id === eventId);
    if (!ev) return;
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
    openEditEvent(ev);
  };

  return (
    <div className={styles.container}>
      {/* Sticky header */}
      <div className={styles.headerRow}>
        <div className={styles.gutterHeader} />
        {days.map(day => {
          const dateStr = fmtDate(day);
          const today   = dateStr === todayStr;
          return (
            <div key={dateStr} className={styles.dayHeader}>
              <span className={styles.dayName}>{DAY_SHORT[day.getDay()]}</span>
              <span className={`${styles.dayNum} ${today ? styles.dayNumToday : ''}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div className={styles.body} ref={scrollRef}>
        {/* Time gutter */}
        <div className={styles.gutter}>
          {HOURS.map(h => (
            <div key={h} className={styles.gutterCell}>
              <span className={styles.timeLabel}>{fmtHourLabel(h)}</span>
            </div>
          ))}
        </div>

        {/* Day columns — one per day, each gets its own colRef */}
        {days.map(day => (
          <DayColumn
            key={fmtDate(day)}
            day={day}
            todayStr={todayStr}
            events={filtered.filter(e => e.date === fmtDate(day))}
            draggingEventId={state.draggingEventId}
            scrollRef={scrollRef}
            getChipDragProps={getChipDragProps}
            getWeekColDropProps={getWeekColDropProps}
            onSlotClick={handleSlotClick}
            onChipClick={handleChipClick}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DayColumn ─────────────────────────────────────────────────────────────────
// Separated so each column has its own ref for drop-position math.

interface DayColumnProps {
  day: Date;
  todayStr: string;
  events: ReturnType<typeof useApp>['state']['events'];
  draggingEventId: string | null;
  scrollRef: React.RefObject<HTMLDivElement>;
  getChipDragProps: ReturnType<typeof useDragEvent>['getChipDragProps'];
  getWeekColDropProps: ReturnType<typeof useDragEvent>['getWeekColDropProps'];
  onSlotClick: (dateStr: string, hour: number) => void;
  onChipClick: (e: React.MouseEvent, id: string) => void;
}

function DayColumn({
  day, todayStr, events, draggingEventId,
  scrollRef, getChipDragProps, getWeekColDropProps,
  onSlotClick, onChipClick,
}: DayColumnProps) {
  const { state } = useApp(); // for event categories 
  const colRef  = useRef<HTMLDivElement>(null);
  const dateStr = fmtDate(day);

  // We pass scrollRef so the drop handler can subtract scroll offset
  const dropProps = getWeekColDropProps(dateStr, scrollRef);

  return (
    <div
      ref={colRef}
      className={styles.dayCol}
      {...dropProps}
    >
      {/* Hour slot backgrounds — clickable, but NOT the drop target */}
      {HOURS.map(h => (
        <div
          key={h}
          className={styles.hourSlot}
          onClick={() => onSlotClick(dateStr, h)}
        />
      ))}

      {/* Current time indicator */}
      {dateStr === todayStr && <CurrentTimeLine />}

      {/* Events */}
      {events.map(ev => (
        <EventChip
          key={ev.id}
          event={ev}
          variant="week"
          isDragging={draggingEventId === ev.id}
          dragProps={getChipDragProps(ev)}
          categoryIcon={state.categories.find(c => c.id === ev.category)?.icon}
          style={{
            top:    timeToY(ev.start),
            height: timeDurationPx(ev.start, ev.end || ev.start),
          }}
          onClick={e => onChipClick(e, ev.id)}
        />
      ))}
    </div>
  );
}

// ─── Current time line ─────────────────────────────────────────────────────────

function CurrentTimeLine() {
  const now = new Date();
  const top = (now.getHours() + now.getMinutes() / 60) * SLOT_HEIGHT;
  return (
    <div className={styles.nowLine} style={{ top }}>
      <div className={styles.nowDot} />
      <div className={styles.nowBar} />
    </div>
  );
}
