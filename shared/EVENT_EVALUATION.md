# Event evaluation framework

The canonical, machine-readable matrix is [event-evaluation.json](event-evaluation.json),
version `event-value-v2`. Both the public Evaluation Scheme page and the Cloudflare
scorer load it. It is derived from the supplied
[English summary](../docs/UW-Social_Event_Evaluation_Summary_EN.md).

## Publication flow

New events are scored from the final form contents immediately before saving.
Editing an event runs the same `/score-event` assessment again. A failed or malformed
AI response prevents the database write and leaves the form available for retry.
Imported scores and instructions in event text are ignored. Existing saved events
are not rescored in bulk.

The model classifies the event by its purpose and agenda:

- `growth`: Learning & Growth — Opportunities & Direction 40%, Meaningful Connections 33%, Knowledge & Insight 27%.
- `social`: Social & Recreation — Social Connection 64%, Relaxation & Well-being 36%.
- `hybrid`: substantial, distinct programs in both categories; evaluate each independently.
- `needs_clarification`: insufficient information to classify; explain what is missing without assigning a score.

Each dimension has three equally weighted criteria. The model returns an integer
rating of 0–4 or `null` (Unknown), plus an English evidence explanation for every
criterion. Zero means evidence confirms absence; unknown information must never be
replaced with zero or a guessed rating. All criteria are required even when unknown.
The summary supplies general rating standards and an interaction example, but not
the full criterion-specific anchor matrix; no additional full-matrix anchors are
claimed here. Add those anchors to the canonical JSON when available and version
any rubric changes.

## Server calculation

The model does not choose aggregate scores. The server validates the category,
all expected dimensions, all criterion IDs, integer ratings, and evidence fields.

- Dimension score = (sum of three criterion ratings / 12) × 100.
- Overall score = sum of (unrounded dimension score × dimension weight).
- Display scores are rounded to the nearest integer only after calculation.
- Unknown criteria use 0 for the lower bound and 4 for the upper bound.
- Information coverage is the sum of each known criterion’s weight (dimension weight / 3).

An incomplete assessment returns `scoreRange` and `informationCoverage`, with no
`score100`, `score`, or `stars`. These bounds are mathematical possibilities, not
confidence intervals. Hybrid events return independent category assessments, with
no combined total or star rating. Needs-clarification events have no numeric rating.

For a complete single-category assessment, the legacy compatibility fields `score`
(out of five) and `stars` are retained; the event detail card displays `score100`.
Star thresholds remain 90 / 75 / 60 / 40. They are compatibility conversions and do
not affect the criterion ratings or percentage score.

## Response and display contract

Every response includes `source: "ai"`, `frameworkVersion`, `model`, `evaluatedAt`,
`evaluationCategory`, `classificationReason`, `categoryEvaluations`, `sentence`,
`confidence`, `confidenceExplanation`, `bestFor`, `scoringBasis`, and `limitations`.
The latter text fields are English and must cite supplied facts or acknowledge
missing information. Confidence is capped at medium when any criteria are unknown
and at low when less than half the relevant scoring weight is known.

Each category evaluation contains `category`, `dimensions`, `informationCoverage`,
and either `score100` or `scoreRange: { lower, upper }`. Dimensions retain their
criterion ratings and evidence, and include a percentage score or range. A
single-category review also exposes these fields at the top level for compatibility.
The public card shows Expected Event Value, category and percentage/range, dimension
scores, Confidence, Best for, Scoring basis, and Main limitations.

Future scrapers should extract facts and call this endpoint rather than accept a
rating on a source page or implement a separate rubric. Compare scores only within
the same category. The seven-response survey weights remain provisional.

## Validation

Run `node --test Cloudflare/test/*.test.mjs Frontend/tests/*.test.cjs` from the repository
root. Tests use mocked AI responses; they do not consume Workers AI inference quota.
Run `npm --prefix Cloudflare run check` for a Worker dry run. Real model output quality
and structured-output support still require verification against the deployed Worker.

## Re-score existing events

`Cloudflare/scripts/rescore-events.mjs` scores and updates only events still visible
in the website’s upcoming list, using the Pacific-time display rule. Expired events
are excluded again at write time; original ratings are preserved. It separates read-only backup, AI scoring, database
updates, and restoration. Local checkpoints are saved under the ignored
`Cloudflare/.wrangler/event-rescore/` directory, with owner-only file permissions.
Never commit these snapshots or credentials.

From the repository root:

```sh
node Cloudflare/scripts/rescore-events.mjs --inventory
CLOUDFLARE_ACCOUNT_ID=<existing-worker-account> node Cloudflare/scripts/rescore-events.mjs --score --limit 1
CLOUDFLARE_ACCOUNT_ID=<existing-worker-account> node Cloudflare/scripts/rescore-events.mjs --score
node Cloudflare/scripts/rescore-events.mjs --apply
```

Scoring reuses the canonical matrix, model prompt, schema, and server calculation
without requiring the new Worker to be deployed first. It uses an existing Wrangler
login (macOS default path) or `CLOUDFLARE_API_TOKEN`; use `WRANGLER_CREDENTIALS_FILE`
for another Wrangler credential path. Credentials stay in memory. A provider failure
stops the run and preserves progress; successful items are skipped when resumed. Completely empty event records are logged and skipped.
`--concurrency 3` enables up to three in-flight assessments; checkpoint writes remain serialized.
`--limit` bounds the number of items in a run; `--state <path>` selects a checkpoint.

Applying scores uses the local Firebase CLI login, or `FIRESTORE_ACCESS_TOKEN`
(an OAuth access token for a Google Cloud identity with Firestore write permission
in this Firebase project). Run `--check-access` to verify read/list/update IAM
permissions without writing data. `FIREBASE_CLI_CONFIG_FILE` overrides the default
macOS/Linux CLI configuration path. Refresh the CLI login if its access token expires.
A public Firebase API key or Cloudflare token cannot grant database write access.
Keep the access token in the local process environment, never in chat or source files.

Only the `review` field is patched. Each write requires the original document’s
`updateTime`, so a concurrently edited event fails rather than receiving a stale
assessment. The original encoded Firestore document is retained in the checkpoint.
`--restore` restores its original review (or removes review if originally absent),
using the post-apply update time to avoid overwriting later edits. A restore must
use the same authenticated Google Cloud identity with write access.
