import type { Event } from './event';

export interface ForumEventSnapshot {
  title: string;
  description: string;
  location: string;
  category: string;
  imageUrl?: string;
  organizerName: string;
  endtime: unknown;
}

export interface Forum {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSnapshot: ForumEventSnapshot;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastPostAt?: unknown;
}

export interface ForumPost {
  id: string;
  text: string;
  userId?: string;
  userEmail?: string | null;
  createdAt?: unknown;
}

export const buildForumEventSnapshot = (event: Event): ForumEventSnapshot => ({
  title: event.title,
  description: event.description,
  location: event.location,
  category: event.category,
  imageUrl: event.imageUrl,
  organizerName: event.organizerName,
  endtime: event.endtime,
});
