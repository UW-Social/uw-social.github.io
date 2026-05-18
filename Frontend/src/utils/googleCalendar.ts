import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';
import { RecurrenceType, type Event, type EventSchedule } from '../types/event';

type GoogleCalendarDateTime = {
  dateTime: string;
};

type GoogleCalendarDate = {
  date: string;
};

type GoogleCalendarEventPayload = {
  summary: string;
  description?: string;
  location?: string;
  start: GoogleCalendarDateTime | GoogleCalendarDate;
  end: GoogleCalendarDateTime | GoogleCalendarDate;
  recurrence?: string[];
};

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const WEEKDAY_TOKENS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const pad = (n: number) => String(n).padStart(2, '0');

const toDate = (value: any): Date => {
  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
};

const parseTime = (time?: string): { hours: number; minutes: number } | null => {
  if (!time) return null;
  const [hoursRaw, minutesRaw = '0'] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return { hours, minutes };
};

const toApiDate = (d: Date): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toRruleDate = (d: Date): string => {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};

const toRruleDateTimeUtc = (d: Date): string => {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

const applyTime = (date: Date, time?: string): Date => {
  const parsed = parseTime(time);
  if (!parsed) return date;

  const withTime = new Date(date);
  withTime.setHours(parsed.hours, parsed.minutes, 0, 0);
  return withTime;
};

const getDateRangeForEvent = (event: Event) => {
  const schedule = event.schedule;

  if (!schedule || schedule.type === RecurrenceType.ONE_TIME) {
    const startValue = schedule?.type === RecurrenceType.ONE_TIME ? schedule.startDatetime : event.startTime;
    const endValue = schedule?.type === RecurrenceType.ONE_TIME ? schedule.endDatetime : event.endtime;

    const start = toDate(startValue);
    const end = toDate(endValue);
    const allDay = event._hasStartTime === false && event._hasEndTime === false;

    return { schedule, start, end, allDay };
  }

  const recurringStartDate = toDate(schedule.startDate);
  const allDay = !schedule.startTimeOfDay;

  const start = applyTime(recurringStartDate, schedule.startTimeOfDay);

  let end: Date;
  if (schedule.endTimeOfDay) {
    end = applyTime(new Date(recurringStartDate), schedule.endTimeOfDay);
  } else if (allDay) {
    end = new Date(recurringStartDate);
  } else {
    end = new Date(start);
    end.setHours(end.getHours() + 1);
  }

  return { schedule, start, end, allDay };
};

const getRecurrence = (schedule: EventSchedule, allDay: boolean): string[] | undefined => {
  if (schedule.type === RecurrenceType.ONE_TIME) {
    return undefined;
  }

  const rrule: string[] = [];

  if (schedule.type === RecurrenceType.DAILY) {
    rrule.push('FREQ=DAILY');
  }

  if (schedule.type === RecurrenceType.WEEKLY) {
    rrule.push('FREQ=WEEKLY');
    if (Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length > 0) {
      const byDay = schedule.daysOfWeek
        .map((d) => WEEKDAY_TOKENS[d])
        .filter(Boolean)
        .join(',');
      if (byDay) {
        rrule.push(`BYDAY=${byDay}`);
      }
    }
  }

  if (schedule.type === RecurrenceType.MONTHLY) {
    rrule.push('FREQ=MONTHLY');
    if (Array.isArray(schedule.daysOfMonth) && schedule.daysOfMonth.length > 0) {
      const byMonthDay = schedule.daysOfMonth.join(',');
      rrule.push(`BYMONTHDAY=${byMonthDay}`);
    }
  }

  if (schedule.endDate) {
    const untilDate = toDate(schedule.endDate);

    if (allDay) {
      rrule.push(`UNTIL=${toRruleDate(untilDate)}`);
    } else {
      const parsedStart = parseTime(schedule.startTimeOfDay);
      if (parsedStart) {
        untilDate.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);
      }
      rrule.push(`UNTIL=${toRruleDateTimeUtc(untilDate)}`);
    }
  }

  return rrule.length > 0 ? [`RRULE:${rrule.join(';')}`] : undefined;
};

const buildGoogleCalendarPayload = (event: Event): GoogleCalendarEventPayload => {
  const { schedule, start, end, allDay } = getDateRangeForEvent(event);

  const payload: GoogleCalendarEventPayload = {
    summary: event.title || 'Event',
    description: event.description || undefined,
    location: event.location || undefined,
    start: allDay
      ? { date: toApiDate(start) }
      : { dateTime: start.toISOString() },
    end: allDay
      ? {
          date: (() => {
            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
            return toApiDate(exclusiveEnd);
          })(),
        }
      : { dateTime: end.toISOString() },
  };

  if (schedule) {
    const recurrence = getRecurrence(schedule, allDay);
    if (recurrence?.length) {
      payload.recurrence = recurrence;
    }
  }

  return payload;
};

export const requestGoogleCalendarAccessToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to add events to Google Calendar.');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_CALENDAR_SCOPE);

  const result = await reauthenticateWithPopup(currentUser, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error('Unable to get Google Calendar permission token.');
  }

  return accessToken;
};

export const addEventToGoogleCalendar = async (event: Event): Promise<{ id: string; htmlLink?: string }> => {
  const accessToken = await requestGoogleCalendarAccessToken();
  const payload = buildGoogleCalendarPayload(event);

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to add event to Google Calendar.';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error?.message || errorMessage;
    } catch (err) {
      console.error('Failed to parse Google Calendar error response:', err);
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { id: string; htmlLink?: string };
  return { id: data.id, htmlLink: data.htmlLink };
};
