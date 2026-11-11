import { useEffect, useRef, MutableRefObject } from 'react';

export type SyncStatus = 'saving' | 'saved' | 'error';

interface Options<T extends { id: string }> {
  items: T[];
  ready: boolean;                                   // don't sync until the first load finished
  baseline: MutableRefObject<Map<string, string>>;  // id -> JSON of what the database already has
  push: (upserts: T[], deletedIds: string[]) => Promise<void>;
  onStatus: (s: SyncStatus) => void;
}

/**
 * Watches a list and saves only what changed (new/edited rows, deleted rows)
 * to the database, debounced so typing doesn't fire a request per keystroke.
 * Failed saves are retried automatically and leave the baseline untouched.
 */
export function useDiffSync<T extends { id: string }>({ items, ready, baseline, push, onStatus }: Options<T>) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pushRef = useRef(push);
  pushRef.current = push;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  const queue = useRef<Promise<void>>(Promise.resolve());
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();

  const run = useRef(async () => {
    const current = itemsRef.current;
    const seen = new Map<string, string>();
    const upserts: T[] = [];
    for (const it of current) {
      const json = JSON.stringify(it);
      seen.set(it.id, json);
      if (baseline.current.get(it.id) !== json) upserts.push(it);
    }
    const deletes: string[] = [];
    baseline.current.forEach((_v, id) => { if (!seen.has(id)) deletes.push(id); });
    if (!upserts.length && !deletes.length) return;

    statusRef.current('saving');
    try {
      await pushRef.current(upserts, deletes);
      upserts.forEach(it => baseline.current.set(it.id, seen.get(it.id) as string));
      deletes.forEach(id => baseline.current.delete(id));
      statusRef.current('saved');
    } catch (err) {
      console.error('Save failed, will retry', err);
      statusRef.current('error');
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(enqueue, 5000);
    }
  });

  // serialize saves so two requests never race each other
  const enqueue = useRef(() => {
    queue.current = queue.current.then(() => run.current());
  }).current;

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(enqueue, 500);
    return () => clearTimeout(t);
  }, [items, ready, enqueue]);

  // best-effort save when the tab is hidden or closed
  useEffect(() => {
    if (!ready) return;
    const flush = () => { if (document.visibilityState === 'hidden') enqueue(); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', enqueue);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', enqueue);
      clearTimeout(retryTimer.current);
    };
  }, [ready, enqueue]);
}
