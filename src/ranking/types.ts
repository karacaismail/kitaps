export type CriterionId =
  | 'editorialConsensus'
  | 'learningLeverage'
  | 'preparationFit'
  | 'accessReadiness'
  | 'collectionCoverage'
  | 'difficultyFit'
  | 'durability';

export type BookStateId =
  | 'onemli'
  | 'alinacak'
  | 'alindi'
  | 'okunuyor'
  | 'okundu'
  | 'araverildi'
  | 'birakildi';

export type BookState = Record<string, readonly string[]>;

export interface ReadingRecord {
  startedAt?: string;
  finishedAt?: string;
  page?: number | string;
  totalPages?: number | string;
  why?: string;
  apply?: string;
  [key: string]: unknown;
}

export interface RankingContext {
  states: BookState;
  queue: readonly string[];
  reading: Readonly<Record<string, ReadingRecord | undefined>>;
}

export interface CatalogBook {
  id: string;
  title?: string;
  author?: string;
  categories?: readonly string[];
  collectionIds?: readonly string[];
  years?: readonly number[];
}

export interface ReadingGuideLink { id: string }
export interface ReadingGuideRoute { books: readonly string[] }

export interface Catalog {
  books: readonly CatalogBook[];
  readingGuides?: {
    routes?: readonly ReadingGuideRoute[];
    overrides?: Readonly<Record<string, {
      before?: readonly ReadingGuideLink[];
      after?: readonly ReadingGuideLink[];
      companions?: readonly ReadingGuideLink[];
    }>>;
  };
}

export interface CriterionResult {
  id: CriterionId;
  label: string;
  /** Domain value before comparison with the current catalog. */
  raw: number;
  /** 0–1 value recalculated against every book currently in the catalog. */
  normalized: number;
  weight: number;
  points: number;
  confidence: number;
  evidence: string;
}

export type ReadinessLevel = 1 | 2 | 3 | 4 | 5;

export interface ReadingPriorityResult {
  bookId: string;
  /** Dense, user-facing rank. Equal priority keys share the same rank. */
  rank: number;
  /** Stable, unique position after deterministic tie-breaking. */
  ordinal: number;
  score: number;
  confidence: number;
  maturity: ReadinessLevel;
  maturityLabel: string;
  criteria: CriterionResult[];
  reasons: string[];
  policyVersion: string;
  signals: {
    owned: boolean;
    readingStatus: 'unread' | 'reading' | 'paused' | 'read' | 'abandoned';
    queuePosition: number | null;
  };
}

export interface ReadingRankingPolicy {
  version: string;
  weights: Readonly<Record<CriterionId, number>>;
}

export interface ReadingRankingSnapshot {
  version: string;
  generatedAt: string;
  ordered: ReadingPriorityResult[];
  byId: Record<string, ReadingPriorityResult>;
}
