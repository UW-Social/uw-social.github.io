export const DEFAULT_TIME_ZONE = 'America/Los_Angeles';

const FALLBACK_TIME_ZONES = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Phoenix',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const FRIENDLY_TIME_ZONE_NAMES: Record<string, string> = {
  'America/Los_Angeles': 'Pacific Time',
  'America/Denver': 'Mountain Time',
  'America/Chicago': 'Central Time',
  'America/New_York': 'Eastern Time',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
  UTC: 'UTC',
};

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: 'timeZone') => string[];
};

const supportedTimeZones = (Intl as IntlWithSupportedValues).supportedValuesOf?.('timeZone')
  ?? FALLBACK_TIME_ZONES;

const orderedTimeZones = [...new Set([
  DEFAULT_TIME_ZONE,
  'UTC',
  ...supportedTimeZones.filter((timeZone) => timeZone !== DEFAULT_TIME_ZONE),
])];

export const TIME_ZONE_OPTIONS = orderedTimeZones.map((value) => ({
  value,
  label: FRIENDLY_TIME_ZONE_NAMES[value]
    ? `${FRIENDLY_TIME_ZONE_NAMES[value]} (${value})`
    : value.replace(/_/g, ' '),
}));

/** Normalizes accepted hour-only and partial time values to the HH:MM format. */
export function normalizeTimeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/^(\d{1,2})(?::(\d{0,2}))?$/);
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (hours > 23 || minutes > 59) return value;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return values as ZonedParts;
}

/** Converts a wall-clock date/time in an IANA time zone into an absolute Date. */
export function createDateInTimeZone(
  dateValue: string,
  timeValue: string,
  timeZone: string,
  seconds = 0,
  milliseconds = 0
): Date {
  const [year, month, day] = dateValue.split('-').map(Number);
  const normalizedTime = normalizeTimeInput(timeValue || '00:00');
  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const intendedUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds);

  // Calculate the zone offset at the requested wall time, then run a second pass
  // because the first result can cross a daylight-saving boundary.
  let result = new Date(intendedUtc);
  for (let pass = 0; pass < 2; pass += 1) {
    const zoned = getZonedParts(result, timeZone);
    const representedUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      milliseconds
    );
    result = new Date(result.getTime() + intendedUtc - representedUtc);
  }

  return result;
}

export function toDateInputInTimeZone(value: Date, timeZone: string): string {
  const parts = getZonedParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function toTimeInputInTimeZone(value: Date, timeZone: string): string {
  const parts = getZonedParts(value, timeZone);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}
