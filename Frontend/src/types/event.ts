/**
 * Defines the type of recurrence for an event.
 */
export enum RecurrenceType {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * Represents a one-time event scheduled for a specific date and time.
 */
export interface OneTimeSchedule {
  type: RecurrenceType.ONE_TIME;
  /** The exact start date and time for the one-time event. */
  startDatetime: Date;
  /** The exact end date and time for the one-time event. Must be on the same day as startDatetime. */
  endDatetime: Date;
}

/**
 * Base interface for all recurring event schedules.
 * Includes common properties like start and optional end dates.
 */
interface BaseRecurringSchedule {
  /** The start date from which the recurrence begins. The time component of this date might be ignored or used as the default time for daily/weekly/monthly events, depending on implementation. */
  startDate: Date;
  /** Optional end date for the recurrence. If not provided, the event recurs indefinitely from the startDate. */
  endDate?: Date;
  /** Optional start time of day for the event, if applicable (e.g., '10:30' for 10:30 AM).
   * This should be a string in 'HH:MM' format.
   */
  startTimeOfDay?: string;
  /** Optional end time of day for the event, if applicable (e.g., '11:00' for 11:00 AM).
   * This should be a string in 'HH:MM' format and must be on the same day as startTimeOfDay.
   */
  endTimeOfDay?: string;
}

/**
 * Represents a daily recurring event.
 */
export interface DailySchedule extends BaseRecurringSchedule {
  type: RecurrenceType.DAILY;
}

/**
 * Represents a weekly recurring event.
 */
export interface WeeklySchedule extends BaseRecurringSchedule {
  type: RecurrenceType.WEEKLY;
  /**
   * An array of numbers representing the days of the week the event occurs.
   * 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
   * Can include multiple days (e.g., [1, 3, 5] for Monday, Wednesday, Friday).
   */
  daysOfWeek: number[];
}

/**
 * Represents a monthly recurring event.
 */
export interface MonthlySchedule extends BaseRecurringSchedule {
  type: RecurrenceType.MONTHLY;
  /**
   * An array of numbers representing the days of the month the event occurs.
   * 1 = 1st of the month, ..., 31 = 31st of the month.
   * Can include multiple days (e.g., [1, 15] for the 1st and 15th of each month).
   * Note: Dates like 30 or 31 will automatically adjust for shorter months (e.g., February).
   */
  daysOfMonth: number[];
}

/**
 * A union type that can represent any type of event schedule:
 * either a one-time event or a daily, weekly, or monthly recurring event.
 */
export type EventSchedule = OneTimeSchedule | DailySchedule | WeeklySchedule | MonthlySchedule;


export interface Event {
  id: string;
  title: string;
  description: string;
  schedule: EventSchedule | null; // Can be null for old events without a schedule
  startTime: any; // Firestore Timestamp
  endtime: any; // Firestore Timestamp
  location: string;
  category: string;
  imageUrl?: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  createdAt: string;
  participants: string[];
  maxParticipants: number | null;
  tags: string[];
  link?: string;
  _hasStartTime?: boolean; // Whether original form had start time
  _hasEndTime?: boolean; // Whether original form had end time
}

function formatDate(date: any): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  try {
    let d: Date;

    if (!date) throw new Error("No date provided");

    // Case 1: Firestore Timestamp object (has .toDate)
    if (typeof date.toDate === 'function') {
      d = date.toDate();
    }
    // Case 2: Firestore-like object with .seconds
    else if (typeof date.seconds === 'number') {
      d = new Date(date.seconds * 1000);
    }
    // Case 3: Native Date
    else if (date instanceof Date) {
      d = date;
    }
    // Case 4: ISO string or timestamp number
    else {
      d = new Date(date);
    }

    // Final sanity check
    if (isNaN(d.getTime())) throw new Error("Invalid date object");

    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  } catch (err) {
    console.warn("formatDate failed:", date, err);
    return 'Invalid date';
  }
}

function toDateValue(date: any): Date | null {
  if (!date) return null;

  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  if (typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }

  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return `from ${startTime}`;
  if (endTime) return `until ${endTime}`;
  return 'time TBD';
}

function formatScheduleLines(lines: Array<[string, string]>): string {
  return lines
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

function formatOrdinalDay(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatRecurringSchedule(event: Event): string {
  const schedule = event.schedule;
  if (!schedule || schedule.type === RecurrenceType.ONE_TIME) {
    return 'Schedule TBD';
  }

  const startDate = toDateValue(schedule.startDate);
  const endDate = toDateValue(schedule.endDate);
  const startText = startDate ? formatDate(startDate) : 'TBD';
  const endText = endDate ? formatDate(endDate) : 'Ongoing';
  const timeRange = formatTimeRange(schedule.startTimeOfDay, schedule.endTimeOfDay);

  if (schedule.type === RecurrenceType.DAILY) {
    return formatScheduleLines([
      ['Start Date', startText],
      ['End Date', endText],
      ['Repeats', 'Every day'],
      ['Time', timeRange],
    ]);
  }

  if (schedule.type === RecurrenceType.WEEKLY) {
    const days = Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length > 0
      ? schedule.daysOfWeek
          .map((day) => WEEKDAY_LABELS[Number(day)])
          .filter(Boolean)
          .join(', ')
      : 'selected days';

    return formatScheduleLines([
      ['Start Date', startText],
      ['End Date', endText],
      ['Repeats', days],
      ['Time', timeRange],
    ]);
  }

  const days = Array.isArray(schedule.daysOfMonth) && schedule.daysOfMonth.length > 0
    ? schedule.daysOfMonth
        .map(Number)
        .filter((day) => day >= 1 && day <= 31)
        .sort((a, b) => a - b)
        .map(formatOrdinalDay)
        .join(', ')
    : 'selected dates';

  return formatScheduleLines([
    ['Start Date', startText],
    ['End Date', endText],
    ['Repeats', `Monthly on ${days}`],
    ['Time', timeRange],
  ]);
}


/**
 * Formats an EventSchedule into a human-readable string.
 */
export function formatEventSchedule(event: Event): string {
  const schedule = event.schedule;

  // Defensive safe formatter for all dates
  const safeFormatDate = (d: any): string => {
    if (!d) return 'Unknown';
    try {
      const date = toDateValue(d);
      return !date ? 'Invalid date' : formatDate(date);
    } catch (err) {
      console.warn("Bad date passed to formatDate:", d, err);
      return 'Invalid date';
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const getDate = (d: any) => toDateValue(d) ?? new Date(NaN);
  const formatTime = (t?: string | Date, hasTime?: boolean) => {
    if (!t) return '';
    if (typeof t === 'string') return t;
    if (t instanceof Date && !isNaN(t.getTime())) {
      // If explicitly told this date doesn't have time, return empty
      if (hasTime === false) return '';
      // Don't show midnight (00:00) or end-of-day times when no time was provided
      const hours = t.getHours();
      const minutes = t.getMinutes();
      if ((hours === 0 && minutes === 0) || (hours === 23 && minutes === 59)) {
        if (hasTime === undefined) return ''; // No explicit time info, don't show default
      }
      return `${pad(hours)}:${pad(minutes)}`;
    }
    return '';
  };

  if (!schedule) {
    // Old schedule format — one-time event
    return `${safeFormatDate(event.startTime)} - ${safeFormatDate(event.endtime)}`;
  }

  switch (schedule.type) {
    case RecurrenceType.ONE_TIME: {
      const start = getDate(schedule.startDatetime);
      const end = getDate(schedule.endDatetime);

      // Check if event has time info stored
      const hasStartTime = event._hasStartTime;
      const hasEndTime = event._hasEndTime;
      
      const startTimeStr = formatTime(start, hasStartTime);
      const endTimeStr = formatTime(end, hasEndTime);
      
      if (startTimeStr && endTimeStr) {
        return `${safeFormatDate(start)} ${startTimeStr} - ${endTimeStr}`;
      } else if (startTimeStr) {
        return `${safeFormatDate(start)} from ${startTimeStr}`;
      } else if (endTimeStr) {
        return `${safeFormatDate(start)} until ${endTimeStr}`;
      } else {
        return `${safeFormatDate(start)}, time TBD`;
      }
    }

    case RecurrenceType.DAILY: {
      return formatRecurringSchedule(event);
    }

    case RecurrenceType.WEEKLY: {
      return formatRecurringSchedule(event);
    }

    case RecurrenceType.MONTHLY: {
      return formatRecurringSchedule(event);
   }

    default:
      throw new Error(`Unknown recurrence type: ${(schedule as any).type}`);
  }
}
