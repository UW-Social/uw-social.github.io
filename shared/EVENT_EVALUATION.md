# Event evaluation framework

The canonical, machine-readable rules are in [event-evaluation.json](event-evaluation.json).
The public framework page and Cloudflare scorer both load this file. Future website
scrapers should extract event facts, then call the same `/score-event` endpoint rather
than inventing a different rubric or accepting ratings found on a source page.

Each dimension is assessed from 0 to 10:

| Dimension | Code | Weight | Primary question |
| --- | --- | --- | --- |
| Knowledge and Skill Growth | K | 35% | Will attendees become meaningfully better builders, engineers, researchers, or thinkers? |
| Networking Quality | N | 25% | How likely are attendees to meet capable and aligned people? |
| Time-to-Value Efficiency | T | 25% | Is the expected value worth the time and energy invested? |
| Organizer Credibility | C | 15% | Does the organizer consistently attract high-quality people and content? |

The JSON file contains the full questions, rationale, and high/low score anchors.
The server calculates `(K × 0.35 + N × 0.25 + T × 0.25 + C × 0.15) × 10`,
rounds to one decimal place, and applies these thresholds to the stored score:

| Score out of 100 | Stars |
| --- | --- |
| 90–100 | 5 |
| 75–<90 | 4 |
| 60–<75 | 3 |
| 40–<60 | 2 |
| <40 | 1 |

The model supplies dimension scores and evidence, never the final score or stars.
The server validates all four dimensions and calculates the total deterministically.
Existing or suggested ratings in pasted documents are ignored. Missing evidence
must be acknowledged; unsupported dimensions receive conservative scores (at most 4),
and incomplete information lowers confidence. Organizer branding alone is not a
track record. This is a pre-event estimate, not a report of firsthand attendance.

New events are evaluated from the final form contents immediately before saving.
Edited events are evaluated again on save. If evaluation fails, no event write occurs;
the form remains available for retry. Old events are not automatically rescored.

Stored `review` fields include `source: "ai"`, `score100`, `stars`, `sentence`,
the four `dimensions` with evidence, `confidence`, `frameworkVersion`, `model`,
and `evaluatedAt`. The legacy `score` field remains on a five-point scale for older
consumers; star counts always come from the thresholds, not from rounding that field.

Example request (Firebase login required):

```json
{
  "event": {
    "title": "Cloud Club Kickoff",
    "description": "Meet the student organizers and learn about the year's plans.",
    "location": "UW Seattle",
    "category": "Club",
    "startDate": "2026-10-29",
    "startTime": "16:00",
    "endDate": "2026-10-29",
    "endTime": "17:00",
    "timeZone": "America/Los_Angeles",
    "recurrenceType": "ONE_TIME",
    "tags": ["Cloud Computing"],
    "link": "https://example.com/event"
  }
}
```

This framework is designed for technical community value. Applying it to sports or
purely social events measures their relevance to that goal, rather than general enjoyment.
Change the framework version when weights, anchors, or score policy change, so saved
evaluations remain auditable.
