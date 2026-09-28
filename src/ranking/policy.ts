import type { CriterionId, ReadingRankingPolicy } from './types.ts';

export const DEFAULT_READING_POLICY: ReadingRankingPolicy = {
  version: 'reading-priority-v1.2.0',
  weights: {
    editorialConsensus: 0.13,
    learningLeverage: 0.22,
    preparationFit: 0.15,
    accessReadiness: 0.14,
    collectionCoverage: 0.10,
    difficultyFit: 0.12,
    durability: 0.14,
  },
};

export const CRITERION_LABELS: Readonly<Record<CriterionId, string>> = {
  editorialConsensus: 'Editoryal kesişim',
  learningLeverage: 'Öğrenme kaldıracı',
  preparationFit: 'Hazırlık uygunluğu',
  accessReadiness: 'Erişim hazırlığı',
  collectionCoverage: 'Kitaplık kapsamı',
  difficultyFit: 'Okuma eşiği',
  durability: 'Kalıcılık',
};

const weightTotal = Object.values(DEFAULT_READING_POLICY.weights)
  .reduce((sum, value) => sum + value, 0);

if (Math.abs(weightTotal - 1) > Number.EPSILON * 10) {
  throw new Error(`Reading ranking weights must total 1; received ${weightTotal}.`);
}
