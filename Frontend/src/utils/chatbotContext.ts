import Fuse from 'fuse.js';
import type { Event } from '../types/event';
import type { UserProfile } from '../types/user';
import type { ChatbotContext, ChatContextEvent } from '../types/chatbot';

const DEFAULT_EVENT_LIMIT = 12;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const converted = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const converted = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  const converted = new Date(value as string | number);
  return Number.isNaN(converted.getTime()) ? null : converted;
}

function formatDate(value: unknown): string | undefined {
  const asDate = toDate(value);
  if (!asDate) return undefined;

  return asDate.toISOString();
}

function isUpcomingOrRecentlyEnded(event: Event): boolean {
  const now = Date.now();
  const graceWindowMs = 3 * 24 * 60 * 60 * 1000;
  const end = toDate(event.endtime)?.getTime();

  if (typeof end !== 'number') return true;
  return end >= now - graceWindowMs;
}

function toContextEvent(event: Event): ChatContextEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    location: event.location,
    startTime: formatDate(event.startTime),
    endTime: formatDate(event.endtime),
    tags: (event.tags ?? []).slice(0, 12),
  };
}

function searchRelevantEvents(events: Event[], query: string): Event[] {
  const trimmed = query.trim();
  if (!trimmed) return events;

  const fuse = new Fuse(events, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'description', weight: 1 },
      { name: 'location', weight: 0.8 },
      { name: 'category', weight: 0.7 },
    ],
    threshold: 0.35,
    distance: 90,
    ignoreLocation: true,
  });

  return fuse.search(trimmed).map((result) => result.item);
}

export function buildChatbotContext(params: {
  events: Event[];
  message: string;
  routePath: string;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  maxEvents?: number;
}): ChatbotContext {
  const { events, message, routePath, userProfile, isLoggedIn } = params;
  const maxEvents = params.maxEvents ?? DEFAULT_EVENT_LIMIT;

  const visibleEvents = events.filter(isUpcomingOrRecentlyEnded);
  const searchedEvents = searchRelevantEvents(visibleEvents, message);
  const chosenEvents = (searchedEvents.length ? searchedEvents : visibleEvents).slice(0, maxEvents);

  const userSignals = [
    ...(userProfile?.tags ?? []),
    ...(userProfile?.goals ?? []),
  ]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 12);

  return {
    routePath,
    isLoggedIn,
    userSignals,
    events: chosenEvents.map(toContextEvent),
  };
}
