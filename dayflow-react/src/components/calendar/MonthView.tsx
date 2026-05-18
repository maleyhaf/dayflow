import React from 'react';
import { useApp } from '../../context/AppContext';
import { parseDate, getMonthCells, DAY_SHORT } from '../../utils/dateUtils';
import { useDragEvent } from '../../hooks/useDragEvent';
import EventChip from './EventChip';
import styles from './MonthView.module.css';

export default function MonthView() {
  const { state, dispatch, openNewEvent, openEditEvent } = useApp();
  const anchor = parseDate(state.currentDate);
  const cells  = getMonthCells(anchor.getFullYear(), anchor.getMonth());

  const { getChipDragProps, getMonthCellDropProps } = useDragEvent();

  const filtered = state.activeFilter
    ? state.events.filter(e => e.category === state.activeFilter)
    : state.events;

  const handleChipClick = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const ev = state.events.find(ev => ev.id === eventId);
    if (!ev) return;
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
    openEditEvent(ev);
  };

  const handleDayNumClick = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    dispatch({ type: 'SET_DATE', payload: dateStr });
    dispatch({ type: 'SET_VIEW', payload: 'week' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        {DAY_SHORT.map(d => (
          <div key={d} className={styles.headerCell}>{d}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map(({ date, dateStr, isCurrentMonth, isToday }) => {
          const dayEvents = filtered.filter(e => e.date === dateStr);
          const dropProps = getMonthCellDropProps(dateStr);

          return (
            <div
              key={dateStr}
              className={[
                styles.cell,
                !isCurrentMonth ? styles.cellOther : '',
                isToday ? styles.cellToday : '',
              ].filter(Boolean).join(' ')}
              onClick={() => openNewEvent(dateStr, '09:00')}
              {...dropProps}
            >
              <span
                className={`${styles.dateNum} ${isToday ? styles.dateNumToday : ''}`}
                onClick={e => handleDayNumClick(e, dateStr)}
              >
                {date.getDate()}
              </span>

              <div className={styles.events}>
                {dayEvents.slice(0, 3).map(ev => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    variant="month"
                    isDragging={state.draggingEventId === ev.id}
                    dragProps={getChipDragProps(ev)}
                    onClick={e => handleChipClick(e, ev.id)}
                  />
                ))}
                {dayEvents.length > 3 && (
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
