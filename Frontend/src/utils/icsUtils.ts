import { RecurrenceType, type Event } from '../types/event';

const pad = (n: number) => String(n).padStart(2, '0');

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
  const title = (event.title || '').replace(/\r?\n/g, ' ');
  const description = (event.description || '').replace(/\r?\n/g, '\\n');
  const location = (event.location || '').replace(/\r?\n/g, ' ');
  const url = event.link || '';

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
    // For recurring, use startDate + optional time; end can be omitted or set with endTimeOfDay
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
        // For all-day, DTEND is exclusive; add +1 day if you want the same day.
        lines.push(`DTEND;VALUE=DATE:${toIcsDate(dtEnd)}`);
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
      rruleParts.push(`UNTIL=${toIcsDateTimeUtc(until)}`);
    }

    if (rruleParts.length) lines.push(`RRULE:${rruleParts.join(';')}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
};

export const downloadIcs = (event: Event) => {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title || 'event'}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
