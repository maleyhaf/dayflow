import React from 'react';
import { useApp } from '../../context/AppContext';
import { parseDate, getMonthCells, fmtDate } from '../../utils/dateUtils';
import { DAY_SHORT } from '../../utils/dateUtils';
import EventChip from './EventChip';
import styles from './MonthView.module.css';

export default function MonthView() {
  const { state, dispatch, openNewEvent } = useApp();
  const anchor = parseDate(state.currentDate);
  const cells = getMonthCells(anchor.getFullYear(), anchor.getMonth());

  const filteredEvents = state.activeFilter
    ? state.events.filter(e => e.category === state.activeFilter)
    : state.events;

  const handleCellClick = (dateStr: string) => {
    openNewEvent(dateStr, '09:00');
  };

  const handleEventClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
  };

  const handleDayNumClick = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    // Jump to week view on that date
    dispatch({ type: 'SET_DATE', payload: dateStr });
    dispatch({ type: 'SET_VIEW', payload: 'week' });
  };

  return (
    <div className={styles.container}>
      {/* Day-name header row */}
      <div className={styles.headerRow}>
        {DAY_SHORT.map(d => (
          <div key={d} className={styles.headerCell}>{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className={styles.grid}>
        {cells.map(({ date, dateStr, isCurrentMonth, isToday }) => {
          const dayEvents = filteredEvents.filter(e => e.date === dateStr);
          const overflow = dayEvents.length > 3;

          return (
            <div
              key={dateStr}
              className={[
                styles.cell,
                !isCurrentMonth ? styles.cellOther : '',
                isToday ? styles.cellToday : '',
              ].join(' ')}
              onClick={() => handleCellClick(dateStr)}
            >
              {/* Date number */}
              <span
                className={`${styles.dateNum} ${isToday ? styles.dateNumToday : ''}`}
                onClick={e => handleDayNumClick(e, dateStr)}
              >
                {date.getDate()}
              </span>

              {/* Events */}
              <div className={styles.events}>
                {dayEvents.slice(0, 3).map(ev => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    variant="month"
                    onClick={e => handleEventClick(e, ev.id)}
                  />
                ))}
                {overflow && (
                  <div
                    className={styles.overflow}
                    onClick={e => {
                      e.stopPropagation();
                      dispatch({ type: 'SET_DATE', payload: dateStr });
                      dispatch({ type: 'SET_VIEW', payload: 'week' });
                    }}
                  >
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
