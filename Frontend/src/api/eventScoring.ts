import { requestAi } from './ai';
import type { EventReviewSummary } from '../types/event';

interface EventScoringDraft {
  title: string;
  description: string;
  location: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timeZone: string;
  recurrenceType: string;
  link: string;
  tags: string[];
}

export async function scoreEventForSubmission(draft: EventScoringDraft): Promise<EventReviewSummary> {
  // Send the current form contents, so edits after import are included in the evaluation.
  const event: EventScoringDraft = {
    title: draft.title, description: draft.description, location: draft.location,
    category: draft.category, startDate: draft.startDate, startTime: draft.startTime,
    endDate: draft.endDate, endTime: draft.endTime, timeZone: draft.timeZone,
    recurrenceType: draft.recurrenceType, link: draft.link, tags: [...draft.tags],
  };
  return requestAi<EventReviewSummary>('/score-event', { event });
}
