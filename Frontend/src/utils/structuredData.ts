import { computed, onBeforeUnmount, watch, type ComputedRef, type Ref } from 'vue';
import { RecurrenceType, type Event } from '../types/event';
import type { DiscussionPost, DiscussionReply, ExperiencePost, Forum, ForumPost } from '../types/forum';

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdObject
  | JsonLdValue[];

type JsonLdObject = {
  [key: string]: JsonLdValue | undefined;
};

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

const SITE_NAME = 'UW Social';
const DEFAULT_SITE_ORIGIN = 'https://uw-social.com';
const DEFAULT_IMAGE = '/images/wavingdog.jpg';

const WEEKDAY_SCHEMA_URLS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
];

function getSiteOrigin(): string {
  const envUrl = String(import.meta.env.VITE_URL || '').trim();
  if (envUrl) {
    return envUrl.startsWith('http') ? envUrl.replace(/\/$/, '') : `https://${envUrl.replace(/\/$/, '')}`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return DEFAULT_SITE_ORIGIN;
}

function absoluteUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;

  try {
    return new URL(pathOrUrl, `${getSiteOrigin()}/`).toString();
  } catch {
    return undefined;
  }
}

function routeUrl(path: string): string {
  return `${getSiteOrigin()}/#${path.startsWith('/') ? path : `/${path}`}`;
}

function compact(value?: string | null): string {
  return (value || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dateFromUnknown(value: unknown): Date | null {
  if (!value) return null;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: number }).seconds === 'number'
  ) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value: unknown): string | undefined {
  return dateFromUnknown(value)?.toISOString();
}

function timeWithSeconds(time?: string): string | undefined {
  if (!time) return undefined;
  const [hours, minutes = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
}

function removeEmpty<T extends JsonLdObject>(input: T): T {
  Object.keys(input).forEach((key) => {
    const value = input[key];
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete input[key];
    }
  });
  return input;
}

function getEventStartDate(event: Event): string | undefined {
  const schedule = event.schedule;
  if (!schedule) return toIso(event.startTime);

  if (schedule.type === RecurrenceType.ONE_TIME) {
    return toIso(schedule.startDatetime);
  }

  return toIso(schedule.startDate);
}

function getEventEndDate(event: Event): string | undefined {
  const schedule = event.schedule;
  if (!schedule) return toIso(event.endtime);

  if (schedule.type === RecurrenceType.ONE_TIME) {
    return toIso(schedule.endDatetime);
  }

  return toIso(schedule.endDate);
}

function buildEventSchedule(event: Event): JsonLdObject | undefined {
  const schedule = event.schedule;
  if (!schedule || schedule.type === RecurrenceType.ONE_TIME) return undefined;

  const scheduleData = removeEmpty({
    '@type': 'Schedule',
    startDate: toIso(schedule.startDate),
    endDate: toIso(schedule.endDate),
    startTime: timeWithSeconds(schedule.startTimeOfDay),
    endTime: timeWithSeconds(schedule.endTimeOfDay),
    scheduleTimezone: 'America/Los_Angeles',
    repeatFrequency:
      schedule.type === RecurrenceType.DAILY
        ? 'P1D'
        : schedule.type === RecurrenceType.WEEKLY
          ? 'P1W'
          : 'P1M',
    byDay: schedule.type === RecurrenceType.WEEKLY
      ? schedule.daysOfWeek
          .map((day) => WEEKDAY_SCHEMA_URLS[Number(day)])
          .filter(Boolean)
      : undefined,
    byMonthDay: schedule.type === RecurrenceType.MONTHLY
      ? schedule.daysOfMonth
          .map(Number)
          .filter((day) => day >= 1 && day <= 31)
      : undefined,
  });

  return Object.keys(scheduleData).length > 1 ? scheduleData : undefined;
}

export function buildEventJsonLd(event: Event): JsonLdObject {
  const eventUrl = routeUrl(`/events/${event.id}`);
  const description = compact(event.description);
  const image = absoluteUrl(event.imageUrl || DEFAULT_IMAGE);

  return removeEmpty({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${eventUrl}#event`,
    name: compact(event.title),
    description,
    url: eventUrl,
    image: image ? [image] : undefined,
    startDate: getEventStartDate(event),
    endDate: getEventEndDate(event),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventSchedule: buildEventSchedule(event),
    keywords: event.tags?.length ? event.tags.join(', ') : event.category,
    location: event.location ? {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location,
        addressLocality: 'Seattle',
        addressRegion: 'WA',
        addressCountry: 'US',
      },
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: compact(event.organizerName) || SITE_NAME,
      url: getSiteOrigin(),
    },
    offers: event.link ? {
      '@type': 'Offer',
      url: event.link,
      availability: 'https://schema.org/InStock',
    } : undefined,
  });
}

function buildComment(reply: DiscussionReply | DiscussionPost | ForumPost): JsonLdObject {
  const content = compact(reply.content || reply.text || '');
  const authorName = compact(reply.authorName || reply.userEmail || 'Anonymous User');

  return removeEmpty({
    '@type': 'Comment',
    text: content,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    datePublished: toIso(reply.createdAt),
    interactionStatistic: typeof reply.likeCount === 'number' ? {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: reply.likeCount,
    } : undefined,
  });
}

export function buildForumJsonLd(
  forum: Forum | null,
  event: Event | null,
  posts: ForumPost[] | DiscussionPost[]
): JsonLdObject | null {
  const eventId = event?.id || forum?.eventId || forum?.id;
  if (!eventId) return null;

  const pageUrl = routeUrl(`/forums/${eventId}`);
  const snapshot = forum?.eventSnapshot;
  const title = compact(event?.title || forum?.eventTitle || snapshot?.title || 'Event discussion');
  const description = compact(event?.description || snapshot?.description || '');
  const image = absoluteUrl(event?.imageUrl || snapshot?.imageUrl || DEFAULT_IMAGE);

  return removeEmpty({
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `${pageUrl}#discussion`,
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    headline: `${title} discussion`,
    text: description || `Discussion for ${title}.`,
    image: image ? [image] : undefined,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteOrigin(),
    },
    datePublished: toIso(forum?.createdAt),
    dateModified: toIso(forum?.updatedAt || forum?.lastPostAt),
    about: event ? buildEventJsonLd(event) : undefined,
    comment: posts.map(buildComment).filter((comment) => Boolean(comment.text)),
  });
}

export function buildExperiencePostJsonLd(
  post: ExperiencePost,
  event: Event | null,
  replies: DiscussionReply[]
): JsonLdObject {
  const pageUrl = routeUrl(`/forum/posts/${post.eventId}/${post.id}`);
  const title = compact(post.title || post.content || 'Event experience');
  const text = compact(post.bodyHtml || post.content || post.text || '');
  const mediaUrls = post.mediaUrls?.map(absoluteUrl).filter(Boolean) as string[] | undefined;

  return removeEmpty({
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `${pageUrl}#post`,
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    headline: title.length > 110 ? `${title.slice(0, 107).trimEnd()}...` : title,
    text,
    image: mediaUrls?.filter((url) => !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)),
    video: mediaUrls
      ?.filter((url) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url))
      .map((url) => ({
        '@type': 'VideoObject',
        name: title,
        contentUrl: url,
        uploadDate: toIso(post.createdAt),
      })),
    author: {
      '@type': 'Person',
      name: compact(post.authorName || post.userEmail || 'Anonymous User'),
    },
    datePublished: toIso(post.createdAt),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: post.likeCount || 0,
    },
    about: event ? buildEventJsonLd(event) : undefined,
    comment: replies.map(buildComment).filter((comment) => Boolean(comment.text)),
  });
}

export function useJsonLd(id: string, data: MaybeRef<JsonLdObject | null | undefined>) {
  const scriptId = `jsonld-${id}`;

  const stop = watch(
    computed(() => data.value),
    (nextData) => {
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!nextData) {
        script?.remove();
        return;
      }

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(nextData);
    },
    { immediate: true, deep: true }
  );

  onBeforeUnmount(() => {
    stop();
    document.getElementById(scriptId)?.remove();
  });
}
