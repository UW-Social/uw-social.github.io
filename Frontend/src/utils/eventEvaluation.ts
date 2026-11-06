import type { EventReviewSummary, EventValueAssessment } from '../types/event';
import { getReviewScore } from './reviewScore';

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
  const legacyScore = getReviewScore(review);

  return {
    assessments: assessments.map(assessment => ({
      category: assessment.category === 'growth' ? 'Growth' : assessment.category === 'social' ? 'Social' : review?.evaluationCategory === 'needs_clarification' ? 'Needs clarification' : 'Category pending',
      score: assessment.scoreRange
        ? `${percentage(assessment.scoreRange.lower)}–${percentage(assessment.scoreRange.upper)}/100`
        : Object.values(assessment.dimensions ?? {}).some(dimension => !finiteScore(dimension.score)) ? 'Score pending'
          : finiteScore(assessment.score100) ? `${percentage(assessment.score100)}/100`
          : !review?.scoreRange && assessments.length === 1 && legacyScore !== null ? `${percentage(legacyScore * 20)}/100` : 'Score pending',
      coverage: finiteScore(assessment.informationCoverage) ? `${percentage(assessment.informationCoverage * 100)}% information coverage` : '',
      dimensions: Object.entries(assessment.dimensions ?? {}).map(([code, dimension]) => ({
        label: dimensionLabels[code] ?? code,
        score: dimension.scoreRange ? `${percentage(dimension.scoreRange.lower)}–${percentage(dimension.scoreRange.upper)}`
          : finiteScore(dimension.score) ? percentage(dimension.score * (isLegacy ? 10 : 1)) : 'Unknown',
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
