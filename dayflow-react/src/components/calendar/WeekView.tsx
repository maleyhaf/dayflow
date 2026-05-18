import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  parseDate, getWeekDays, fmtDate, isSameDay, isToday,
  fmtHourLabel, timeToY, timeDurationPx,
  SLOT_HEIGHT, DAY_SHORT,
} from '../../utils/dateUtils';
import EventChip from './EventChip';
import styles from './WeekView.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView() {
  const { state, dispatch, openNewEvent, openEditEvent } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchor = parseDate(state.currentDate);
  const days = getWeekDays(anchor);
  const todayStr = fmtDate(new Date());

  // Scroll to 7am on mount / week change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * SLOT_HEIGHT - 16;
    }
  }, [state.currentDate]);

  const filteredEvents = state.activeFilter
    ? state.events.filter(e => e.category === state.activeFilter)
    : state.events;

  const handleSlotClick = (dateStr: string, hour: number) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    openNewEvent(dateStr, time);
  };

  const handleEventClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const ev = state.events.find(ev => ev.id === eventId);
    if (!ev) return;
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
    openEditEvent(ev);
  };

  return (
    <div className={styles.container}>
      {/* Sticky column headers */}
      <div className={styles.headerRow}>
        {/* Time gutter header */}
        <div className={styles.gutterHeader} />

        {days.map(day => {
          const dateStr = fmtDate(day);
          const today = dateStr === todayStr;
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

        {/* Day columns */}
        {days.map(day => {
          const dateStr = fmtDate(day);
          const dayEvents = filteredEvents.filter(e => e.date === dateStr);

          return (
            <div key={dateStr} className={styles.dayCol}>
              {/* Hour slot backgrounds — clickable */}
              {HOURS.map(h => (
                <div
                  key={h}
                  className={styles.hourSlot}
                  onClick={() => handleSlotClick(dateStr, h)}
                />
              ))}

              {/* Current time indicator */}
              {dateStr === todayStr && <CurrentTimeLine />}

              {/* Events */}
              {dayEvents.map(ev => {
                const top = timeToY(ev.start);
                const height = timeDurationPx(ev.start, ev.end || ev.start);
                return (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    variant="week"
                    style={{ top, height }}
                    onClick={e => handleEventClick(e, ev.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Current Time Indicator ────────────────────────────────────────────────────

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
