import { defineStore } from 'pinia';
import { ref } from 'vue';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Event } from '../types/event';

export const useEventStore = defineStore('event', () => {
  const events = ref<Event[]>([]);
  const isLoading = ref(false);
  const fetchError = ref('');
  let pendingFetch: Promise<void> | null = null;
  const selectedEvents = ref<Event[]>([]); // 存储选中的事件

  const fetchEvents = (): Promise<void> => {
    if (pendingFetch) return pendingFetch;
    pendingFetch = loadEvents().finally(() => { pendingFetch = null; });
    return pendingFetch;
  };

  const loadEvents = async () => {
    isLoading.value = true;
    fetchError.value = '';

    try {
      const eventsCollection = collection(db, 'events');
      const eventsQuery = query(eventsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(eventsQuery);

      events.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      console.log('[EventStore] fetched events', {
        count: events.value.length,
        firstEvents: events.value.slice(0, 5).map(event => ({
          id: event.id,
          title: event.title,
          createdAt: event.createdAt,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'unknown';
      fetchError.value = `Unable to load events (${code}). Check your internet connection and try again.`;
    } finally {
      isLoading.value = false;
    }
  };

  const selectEvent = (event: Event) => {
    selectedEvents.value.push(event);
  };

  const clearSelectedEvents = () => {
    selectedEvents.value = [];
  };

  return {
    events,
    isLoading,
    fetchError,
    selectedEvents,
    fetchEvents,
    selectEvent,
    clearSelectedEvents,
  };
});
