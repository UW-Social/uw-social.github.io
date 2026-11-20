/** Normalize imported or legacy percentage scores to the 0.0–5.0 review scale. */
export function normalizeReviewScore(score: number, scale?: number): number {
  if (!Number.isFinite(score)) return 0;
  const maximum = scale ?? (score > 5 ? 100 : 5);
  const converted = maximum > 0 ? score * 5 / maximum : 0;
  return Math.round(Math.min(5, Math.max(0, converted)) * 10) / 10;
}

export function parseReviewScore(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*(100|5(?:\.0)?)(?![\d.])|(%))/);
  if (!match) return null;
  return normalizeReviewScore(Number(match[1]), match[3] ? 100 : Number(match[2]));
}

export const REVIEW_SCORE_RULES = `
- All review scores must use a 0.0–5.0 scale, rounded to one decimal place (for example, 4.3/5.0).
- Convert source scores out of 100 or percentages by dividing by 20 (86/100 = 4.3/5.0); never clamp a percentage directly to 5.
- Keep scores already out of 5 on the same scale. reviewStars is an integer from 1 to 5.
- Any score mentioned in reviewSentence must also use the 5.0 scale, never a percentage or a score out of 100.
- If no review is present, use null for reviewScore and reviewStars and an empty reviewSentence.
`.trim();

/** Display both current AI reviews and older saved reviews on the same scale. */
export function getReviewScore(review?: { score?: number; score100?: number } | null): number | null {
  if (typeof review?.score100 === 'number' && Number.isFinite(review.score100)) {
    return normalizeReviewScore(review.score100, 100);
  }
  if (typeof review?.score === 'number' && Number.isFinite(review.score)) {
    return normalizeReviewScore(review.score);
  }
  return null;
}
