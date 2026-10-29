import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Api } from '../api/api';
import { useAuth } from './AuthContext';

const KEY = 'eventease_current_event';
const EventContext = createContext(null);
export const useEvents = () => useContext(EventContext);

// Holds the organizer's event list + which event is "current" (the one shown on every page)
export function EventProvider({ children }) {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(isOrganizer);
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(KEY));

  const refresh = useCallback(async () => {
    if (!isOrganizer) { setEvents([]); setLoading(false); return []; }
    try {
      const list = await Api.getEvents();
      setEvents(list);
      return list;
    } finally { setLoading(false); }
  }, [isOrganizer]);

  useEffect(() => { refresh().catch(() => {}); }, [refresh, user?._id]);

  const current = useMemo(() => events.find(e => e._id === currentId) || events[0] || null, [events, currentId]);

  useEffect(() => { if (current) localStorage.setItem(KEY, current._id); }, [current]);

  const setCurrent = useCallback(id => { localStorage.setItem(KEY, id); setCurrentId(id); }, []);

  const value = useMemo(() => ({ events, current, loading, refresh, setCurrent }), [events, current, loading, refresh, setCurrent]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
