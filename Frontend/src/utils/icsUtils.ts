import { RecurrenceType, type Event } from '../types/event';

const pad = (n: number) => String(n).padStart(2, '0');

// Escape special characters in iCalendar text values per RFC 5545
const escapeIcsText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\') // Backslash first
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
};

const toIcsDateTimeUtc = (d: Date) => {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

const toIcsDate = (d: Date) => {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};

const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const buildEventIcs = (event: Event): string => {
  const now = new Date();
  const uid = `${event.id}@uw-social`;
  const title = escapeIcsText(event.title || '');
  const description = escapeIcsText(event.description || '');
  const location = escapeIcsText(event.location || '');
  const url = escapeIcsText(event.link || '');

  // Determine start/end source
  const schedule = event.schedule;

  let dtStart: Date | null = null;
  let dtEnd: Date | null = null;
  let allDay = false;

  if (!schedule) {
    const start = event.startTime?.toDate?.() ?? new Date(event.startTime);
    const end = event.endtime?.toDate?.() ?? new Date(event.endtime);
    dtStart = start;
    dtEnd = end;
    allDay = event._hasStartTime === false && event._hasEndTime === false;
  } else if (schedule.type === RecurrenceType.ONE_TIME) {
    const start = schedule.startDatetime?.toDate?.() ?? new Date(schedule.startDatetime);
    const end = schedule.endDatetime?.toDate?.() ?? new Date(schedule.endDatetime);
    dtStart = start;
    dtEnd = end;
    allDay = event._hasStartTime === false && event._hasEndTime === false;
  } else {
    const start = schedule.startDate?.toDate?.() ?? new Date(schedule.startDate);
    dtStart = start;
    // For recurring, apply startTimeOfDay and endTimeOfDay to construct proper start/end times
    if (schedule.startTimeOfDay) {
      const [h, m] = schedule.startTimeOfDay.split(':').map(Number);
      dtStart.setHours(h, m, 0, 0);
    }
    if (schedule.endTimeOfDay) {
      const [h, m] = schedule.endTimeOfDay.split(':').map(Number);
      const end = new Date(start);
      end.setHours(h, m, 0, 0);
      dtEnd = end;
    }
    allDay = !schedule.startTimeOfDay;
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UW Social//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTimeUtc(now)}`,
  ];

  if (title) lines.push(`SUMMARY:${title}`);
  if (description) lines.push(`DESCRIPTION:${description}`);
  if (location) lines.push(`LOCATION:${location}`);
  if (url) lines.push(`URL:${url}`);

  if (dtStart) {
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(dtStart)}`);
      if (dtEnd) {
        // For all-day, DTEND is exclusive; must be the next day after the event's last day
        const exclusiveEnd = new Date(dtEnd);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${toIcsDate(exclusiveEnd)}`);
      }
    } else {
      lines.push(`DTSTART:${toIcsDateTimeUtc(dtStart)}`);
      if (dtEnd) lines.push(`DTEND:${toIcsDateTimeUtc(dtEnd)}`);
    }
  }

  // RRULE for recurring
  if (schedule && schedule.type !== RecurrenceType.ONE_TIME) {
    const rruleParts: string[] = [];
    if (schedule.type === RecurrenceType.DAILY) rruleParts.push('FREQ=DAILY');
    if (schedule.type === RecurrenceType.WEEKLY) rruleParts.push('FREQ=WEEKLY');
    if (schedule.type === RecurrenceType.MONTHLY) rruleParts.push('FREQ=MONTHLY');

    if (schedule.type === RecurrenceType.WEEKLY && schedule.daysOfWeek?.length) {
      rruleParts.push(`BYDAY=${schedule.daysOfWeek.map(d => dayMap[d]).join(',')}`);
    }
    if (schedule.type === RecurrenceType.MONTHLY && schedule.daysOfMonth?.length) {
      rruleParts.push(`BYMONTHDAY=${schedule.daysOfMonth.join(',')}`);
    }
    if (schedule.endDate) {
      const until = schedule.endDate?.toDate?.() ?? new Date(schedule.endDate);
      // UNTIL must match DTSTART format: DATE for all-day, DATE-TIME for timed
      if (allDay) {
        rruleParts.push(`UNTIL=${toIcsDate(until)}`);
      } else {
        rruleParts.push(`UNTIL=${toIcsDateTimeUtc(until)}`);
      }
    }

    if (rruleParts.length) lines.push(`RRULE:${rruleParts.join(';')}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
};

// Sanitize filename by removing invalid characters
const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'event';
  return filename
    .replace(/[/\\:?*"<>|\n\r]/g, '_')
    .substring(0, 200); // Limit length
};

export const downloadIcs = (event: Event) => {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(event.title || 'event')}.ics`;
  // Append to DOM, click, remove, then revoke to support Safari/Firefox
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};
