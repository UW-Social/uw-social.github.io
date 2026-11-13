# Event evaluation framework

The canonical, machine-readable matrix is [event-evaluation.json](event-evaluation.json),
version `event-value-v4`. Both the public Evaluation Scheme page and the Cloudflare
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

Each dimension has three equally weighted criteria. Every applicable criterion must
have an integer rating of 0–4 and an explanation based on event facts. Explain any
inference as an estimate and lower confidence for incomplete evidence. Never assign
a default midpoint to missing ratings. If the event cannot meaningfully be assessed,
return needs_clarification instead of inventing ratings. The summary does not supply
a full criterion-specific anchor matrix.

## Server calculation

The model does not choose aggregate scores. The server validates the category,
all expected dimensions, all criterion IDs, integer ratings, and evidence fields.

- Raw dimension score = (sum of three criterion ratings / 12) × 100.
- Growth raw overall = Opportunities & Direction × 0.40 + Meaningful Connections × 0.33 + Knowledge & Insight × 0.27.
- Social raw overall = Social Connection × 0.64 + Relaxation & Well-being × 0.36.
- Displayed total `score100` = round(60 + raw overall score × 0.4), within 60–100.
- `rawScore100` retains the unrounded raw total; calculate from unrounded dimension scores.
- Null, missing, fractional or out-of-range ratings are rejected, never imputed.

Hybrid keeps independent totals; needs_clarification has no numeric total. Confidence
is assessed separately from evidence quality, never inferred from the presence of
numeric ratings. Compatibility fields `score` and `stars` use the curved total.

Saved ranges cannot supply an individual estimate and are displayed as pending.
Incomplete v3 neutral-filled scores also require reassessment. Complete v2 totals
can still use the curve; complete v3 and v4 totals are already curved. Older imported
pre-matrix review scales retain their meanings. There are no automatic database
writes or AI calls when reading old reviews.

## Response and display contract

Every response includes `source: "ai"`, `frameworkVersion`, `model`, `evaluatedAt`,
`evaluationCategory`, `classificationReason`, `categoryEvaluations`, `sentence`,
`confidence`, `confidenceExplanation`, `bestFor`, `scoringBasis`, and `limitations`.
The latter text fields are English and must cite supplied facts or acknowledge
missing information. Confidence explains evidence quality and any assumptions or missing details.

Each category evaluation contains `category`, `dimensions`, `rawScore100` and curved `score100`. Dimensions
retain criterion ratings and evidence plus raw scores. Single-category reviews expose
these fields at the top level for compatibility. The public card shows both totals and dimensions on the same curved 3.0–5.0 scale, with one decimal place. Totals divide the already-curved score by 20; raw dimensions first apply (60 + raw score × 0.4), then divide by 20. The linear mapping preserves the fixed-weight relationship before rounding. Stored percentage scores are unchanged. The card shows a single total,
curved dimension scores, Confidence, Best for, Scoring basis, and Main limitations.

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
macOS/Linux CLI configuration path. Expired access tokens are refreshed in memory using the existing CLI refresh token. Sign in again if refresh is rejected; credentials are never saved in scoring checkpoints.
A public Firebase API key or Cloudflare token cannot grant database write access.
Keep the access token in the local process environment, never in chat or source files.

Only the `review` field is patched. Each write requires the original document’s
`updateTime`, so a concurrently edited event fails rather than receiving a stale
assessment. The original encoded Firestore document is retained in the checkpoint.
`--restore` restores its original review (or removes review if originally absent),
using the post-apply update time to avoid overwriting later edits. A restore must
use the same authenticated Google Cloud identity with write access.
