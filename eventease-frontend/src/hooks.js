import { useCallback, useEffect, useState } from 'react';
import { Api } from './api/api';
import { useToast } from './context/ToastContext';

// Loads one collection (guests | tasks | activities | expenses) of an event
export function useCollection(eventId, col) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try { setItems(await Api.list(eventId, col)); }
    catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [eventId, col, toast]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);
  return { items, setItems, loading, reload };
}
