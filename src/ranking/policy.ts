import type { CriterionId, ReadingRankingPolicy } from './types.ts';

export const DEFAULT_READING_POLICY: ReadingRankingPolicy = {
  version: 'reading-priority-v1.0.0',
  weights: {
    editorialConsensus: 0.12,
    learningLeverage: 0.17,
    accessReadiness: 0.18,
    readingMomentum: 0.25,
    queueCommitment: 0.10,
    collectionCoverage: 0.07,
    difficultyFit: 0.06,
    durability: 0.05,
  },
};

export const CRITERION_LABELS: Readonly<Record<CriterionId, string>> = {
  editorialConsensus: 'Editoryal kesişim',
  learningLeverage: 'Öğrenme kaldıracı',
  accessReadiness: 'Erişim hazırlığı',
  readingMomentum: 'Okuma ivmesi',
  queueCommitment: 'Okuma sırası',
  collectionCoverage: 'Kitaplık kapsamı',
  difficultyFit: 'Okuma eşiği',
  durability: 'Kalıcılık',
};

const weightTotal = Object.values(DEFAULT_READING_POLICY.weights)
  .reduce((sum, value) => sum + value, 0);

if (Math.abs(weightTotal - 1) > Number.EPSILON * 10) {
  throw new Error(`Reading ranking weights must total 1; received ${weightTotal}.`);
}
