import type { Event } from './event';
import { formatEventSchedule } from './event';

export interface ForumEventSnapshot {
  title: string;
  description: string;
  location: string;
  category: string;
  imageUrl?: string;
  organizerName: string;
  scheduleSummary?: string;
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
  eventId: string;
  eventTitle?: string;
  eventLocation?: string;
  eventSchedule?: string;
  title?: string;
  subtitle?: string;
  content: string;
  text?: string;
  bodyHtml?: string;
  mediaUrls?: string[];
  authorName?: string;
  postType?: 'event' | 'review' | 'general';
  likeCount?: number;
  replyCount?: number;
  userId?: string;
  userEmail?: string | null;
  createdAt?: unknown;
}

export interface DiscussionReply {
  id: string;
  postId: string;
  eventId: string;
  content: string;
  text?: string;
  authorName?: string;
  userId?: string;
  userEmail?: string | null;
  createdAt?: unknown;
  likeCount: number;
  hasLiked?: boolean;
}

export interface DiscussionPost extends ForumPost {
  likeCount: number;
  replyCount: number;
  hasLiked?: boolean;
  replies: DiscussionReply[];
}

export interface ExperiencePost extends ForumPost {
  likeCount: number;
  replyCount: number;
  hasLiked?: boolean;
}

export interface AggregatedForumPost extends ForumPost {
  eventTitle: string;
  eventLocation?: string;
  eventSchedule?: string;
}

export interface AggregatedDiscussionPost extends DiscussionPost {
  eventTitle: string;
  eventLocation?: string;
  eventSchedule?: string;
}

export interface AggregatedExperiencePost extends ExperiencePost {
  eventTitle: string;
  eventLocation?: string;
  eventSchedule?: string;
}

export const buildForumEventSnapshot = (event: Event): ForumEventSnapshot => ({
  title: event.title,
  description: event.description,
  location: event.location,
  category: event.category,
  imageUrl: event.imageUrl,
  organizerName: event.organizerName,
  scheduleSummary: formatEventSchedule(event),
  endtime: event.endtime,
});
