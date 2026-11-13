import type { EventReviewSummary, EventValueAssessment } from '../types/event';
import { getReviewScore100, normalizeReviewScore } from './reviewScore';

const dimensionLabels: Record<string, string> = {
  opportunitiesDirection: 'Opportunities & Direction',
  meaningfulConnections: 'Meaningful Connections',
  knowledgeInsight: 'Knowledge & Insight',
  socialConnection: 'Social Connection',
  relaxationWellbeing: 'Relaxation & Well-being',
  K: 'Knowledge and Skill Growth', N: 'Networking Quality',
  T: 'Time-to-Value Efficiency', C: 'Organizer Credibility',
};

const finiteScore = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const percentage = (value: number) => String(Math.round(Math.max(0, Math.min(100, value))));

const fivePointScore = (value: number) => `${normalizeReviewScore(value, 100).toFixed(1)}/5`;

export function getEventValueDisplay(review?: EventReviewSummary | null) {
  const assessments: Array<Partial<EventValueAssessment>> = review?.categoryEvaluations?.length
    ? review.categoryEvaluations
    : review?.evaluationCategory === 'hybrid' ? [{ category: 'growth' }, { category: 'social' }] : [{
      category: review?.evaluationCategory === 'growth' || review?.evaluationCategory === 'social'
        ? review.evaluationCategory : undefined,
      score100: review?.score100,
      scoreRange: review?.scoreRange,
      informationCoverage: review?.informationCoverage,
      dimensions: review?.dimensions,
    }];
  const isLegacy = review?.frameworkVersion === 'tech-event-v1';
  const legacyScore = getReviewScore100(review);

  return {
    assessments: assessments.map(assessment => ({
      category: assessment.category === 'growth' ? 'Growth' : assessment.category === 'social' ? 'Social' : review?.evaluationCategory === 'needs_clarification' ? 'Needs clarification' : 'Category pending',
      score: (() => {
        const score = getReviewScore100({ ...assessment, frameworkVersion: review?.frameworkVersion });
        if (score !== null) return fivePointScore(score);
        return assessments.length === 1 && !assessment.category && legacyScore !== null
          ? fivePointScore(legacyScore) : 'Score pending';
      })(),
      coverage: finiteScore(assessment.informationCoverage) ? `${percentage(assessment.informationCoverage * 100)}% information coverage` : '',
      dimensions: Object.entries(assessment.dimensions ?? {}).map(([code, dimension]) => ({
        label: dimensionLabels[code] ?? code,
        score: dimension.informationCoverage === 0 || dimension.scoreRange
          || (review?.frameworkVersion === 'event-value-v3' && dimension.informationCoverage !== 1) ? 'Needs reassessment'
          : finiteScore(dimension.score) ? fivePointScore(isLegacy ? dimension.score * 10 : 60 + dimension.score * 0.4) : 'Unknown',
      })),
    })),
    classificationReason: review?.classificationReason?.trim() || '',
    confidence: review?.confidence ? review.confidence.charAt(0).toUpperCase() + review.confidence.slice(1) : 'Not assessed',
    confidenceExplanation: review?.confidenceExplanation?.trim() || '',
    bestFor: review?.bestFor?.trim() || 'Not specified',
    scoringBasis: review?.scoringBasis?.trim()
      || [...new Set(Object.values(review?.dimensions ?? {}).map(dimension => dimension.evidence?.trim()).filter(Boolean))].join(' ')
      || [...new Set((review?.categoryEvaluations ?? []).flatMap(assessment => Object.values(assessment.dimensions ?? {}).map(dimension => dimension.evidence?.trim())).filter(Boolean))].join(' ')
      || 'Supporting evidence has not been provided.',
    limitations: review?.limitations?.trim() || 'Not specified',
  };
}
