import React from 'react';
import { useApp } from '../../context/AppContext';
import CalendarHeader from './CalendarHeader';
import WeekView from './WeekView';
import MonthView from './MonthView';
import styles from './CalendarView.module.css';

export default function CalendarView() {
  const { state } = useApp();

  return (
    <div className={styles.container}>
      <CalendarHeader />
      {state.viewMode === 'week' ? <WeekView /> : <MonthView />}
    </div>
  );
}
