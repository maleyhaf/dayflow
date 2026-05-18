import { useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { SLOT_HEIGHT, fmtDisplayTime } from '../utils/dateUtils';

// ─── Ghost ────────────────────────────────────────────────────────────────────

let ghostEl: HTMLDivElement | null = null;

function createGhost(event: CalendarEvent): HTMLDivElement {
  removeGhost();
  const el = document.createElement('div');
  el.id = 'df-drag-ghost';
  el.innerHTML = `
    <div style="font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px">${event.title}</div>
    <div id="df-ghost-time" style="font-size:11px;opacity:0.85;margin-top:2px"></div>
  `;
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '99999',
    background: event.color,
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '7px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
    opacity: '0',           // start invisible, show on first mousemove
    userSelect: 'none',
    top: '0',
    left: '0',
    // use translate for positioning so top/left are always 0,0
    // we move it via transform
    willChange: 'transform',
  });
  document.body.appendChild(el);
  ghostEl = el;
  return el;
}

function moveGhost(x: number, y: number) {
  if (!ghostEl) return;
  // Offset so ghost appears just centered on cursor — adjust as needed
  const offsetX = -ghostEl.offsetWidth / 2;
  const offsetY = -ghostEl.offsetHeight / 2;
  //snap x so that it snaps column to column, which is every 28px (24px column + 4px gap)
  const snapx = 28; // 24px column + 4px gap
  // snaps every 15 minutes would be 12px, so we can snap to that grid for smoother movement
  const snapy = (15 / 60) * SLOT_HEIGHT; // 15-minute increments
  const snappedX = Math.round(x / snapx) * snapx;
  const snappedY = Math.round(y / snapy) * snapy;
  ghostEl.style.transform = `translate(${snappedX + offsetX}px, ${snappedY + offsetY}px)`;
  ghostEl.style.opacity = '0.95';
}

function updateGhostTime(timeStr: string) {
  const el = document.getElementById('df-ghost-time');
  if (el) el.textContent = timeStr;
}

function removeGhost() {
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapToMinutes(raw: number, snap = 15): number {
  // Snap raw minutes to nearest increment (default 15 minutes)
  // 
  return Math.round(raw / snap) * snap;
}

function minutesToTimeStr(total: number): string {
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 45));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function durationMin(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max((eh * 60 + em) - (sh * 60 + sm), 15);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseDragEventReturn {
  getChipDragProps: (event: CalendarEvent) => {
    draggable: true;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
  getWeekColDropProps: (
    dateStr: string,
    scrollRef: React.RefObject<HTMLDivElement>
  ) => {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  getMonthCellDropProps: (dateStr: string) => {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export function useDragEvent(): UseDragEventReturn {
  const { state, dispatch } = useApp();

  const draggingEventRef = useRef<CalendarEvent | null>(null);
  const lastSnappedTimeRef = useRef<string>('');
  const lastSnappedDateRef = useRef<string>('');
  const enterCounters = useRef<WeakMap<Element, number>>(new WeakMap());

  // ── Highlight helpers ──────────────────────────────────────────────────────

  const addHL = (el: Element) => el.classList.add('df-drag-over');
  const removeHL = (el: Element) => el.classList.remove('df-drag-over');
  const clearAllHL = () => {
    document.querySelectorAll('.df-drag-over').forEach(el => el.classList.remove('df-drag-over'));
    enterCounters.current = new WeakMap();
  };

  // ── Global dragover — move ghost with cursor ───────────────────────────────
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (draggingEventRef.current) moveGhost(e.clientX, e.clientY);
    };
    document.addEventListener('dragover', onDragOver);
    return () => document.removeEventListener('dragover', onDragOver);
  }, []);


  // ── Chip drag props ────────────────────────────────────────────────────────

  const getChipDragProps = useCallback((event: CalendarEvent) => ({
    draggable: true as const,

    onDragStart: (e: React.DragEvent) => {
      draggingEventRef.current = event;
      lastSnappedTimeRef.current = event.start;
      lastSnappedDateRef.current = event.date;

      // Completely invisible native drag image
      const blank = document.createElement('div');
      Object.assign(blank.style, {
        position: 'fixed', top: '-9999px', left: '-9999px',
        width: '1px', height: '1px', opacity: '0',
      });
      document.body.appendChild(blank);
      e.dataTransfer.setDragImage(blank, 0, 0);
      requestAnimationFrame(() => blank.remove());

      e.dataTransfer.effectAllowed = 'move';

      createGhost(event);
      updateGhostTime(fmtDisplayTime(event.start));
      moveGhost(e.clientX, e.clientY);

      dispatch({ type: 'SET_DRAGGING', payload: event.id });
    },

    onDragEnd: (_e: React.DragEvent) => {
      // Always clean up regardless of where drop happened
      removeGhost();
      clearAllHL();
      draggingEventRef.current = null;
      dispatch({ type: 'SET_DRAGGING', payload: null });
    },
  }), [dispatch]);

  // ── Week column drop props ─────────────────────────────────────────────────

  const getWeekColDropProps = useCallback((
    dateStr: string,
    scrollRef: React.RefObject<HTMLDivElement>
  ) => {

    const calcSnappedTime = (clientY: number): string => {
      if (!scrollRef.current) return lastSnappedTimeRef.current;
      const rect = scrollRef.current.getBoundingClientRect();
      // Prefer the visual ghost top so snapping lines up with the ghost position.
      // Fallback to the pointer Y if ghost isn't ready yet.
      const y = (ghostEl && typeof window !== 'undefined') ? ghostEl.getBoundingClientRect().top : clientY;
      // position relative to top of scrollable content (include scrollTop)
      const relY = y - rect.top + scrollRef.current.scrollTop;
      const rawMin = (relY / SLOT_HEIGHT) * 60;
      return minutesToTimeStr(snapToMinutes(rawMin));
    };

    return {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        const el = e.currentTarget as Element;
        const count = (enterCounters.current.get(el) ?? 0) + 1;
        enterCounters.current.set(el, count);
        if (count === 1) addHL(el);
      },

      onDragLeave: (e: React.DragEvent) => {
        const el = e.currentTarget as Element;
        const count = Math.max((enterCounters.current.get(el) ?? 1) - 1, 0);
        enterCounters.current.set(el, count);
        if (count === 0) removeHL(el);
      },

      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const ev = draggingEventRef.current;
        if (!ev) return;

        const newStart = calcSnappedTime(e.clientY);

        if (newStart !== lastSnappedTimeRef.current || dateStr !== lastSnappedDateRef.current) {
          lastSnappedTimeRef.current = newStart;
          lastSnappedDateRef.current = dateStr;
          const dur = durationMin(ev.start, ev.end);
          const [h, m] = newStart.split(':').map(Number);
          const newEnd = minutesToTimeStr(h * 60 + m + dur);
          updateGhostTime(`${fmtDisplayTime(newStart)} – ${fmtDisplayTime(newEnd)}`);
        }
      },

      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const el = e.currentTarget as Element;
        removeHL(el);
        enterCounters.current.set(el, 0);

        const ev = draggingEventRef.current;
        if (!ev) return;

        const newStart = calcSnappedTime(e.clientY);
        const dur = durationMin(ev.start, ev.end);
        const [h, m] = newStart.split(':').map(Number);
        const newEnd = minutesToTimeStr(h * 60 + m + dur);

        // Remove ghost immediately on drop — don't wait for dragEnd
        removeGhost();

        dispatch({
          type: 'UPDATE_EVENT',
          payload: { ...ev, date: dateStr, start: newStart, end: newEnd },
        });
      },
    };
  }, [dispatch]);

  // ── Month cell drop props ─────────────────────────────────────────────────

  const getMonthCellDropProps = useCallback((dateStr: string) => ({
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      const el = e.currentTarget as Element;
      const count = (enterCounters.current.get(el) ?? 0) + 1;
      enterCounters.current.set(el, count);
      if (count === 1) addHL(el);
    },

    onDragLeave: (e: React.DragEvent) => {
      const el = e.currentTarget as Element;
      const count = Math.max((enterCounters.current.get(el) ?? 1) - 1, 0);
      enterCounters.current.set(el, count);
      if (count === 0) removeHL(el);
    },

    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },

    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const el = e.currentTarget as Element;
      removeHL(el);
      enterCounters.current.set(el, 0);

      const ev = draggingEventRef.current;
      if (!ev) return;

      removeGhost();

      dispatch({
        type: 'UPDATE_EVENT',
        payload: { ...ev, date: dateStr },
      });
    },
  }), [dispatch]);

  return { getChipDragProps, getWeekColDropProps, getMonthCellDropProps };
}
