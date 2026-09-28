export type CriterionId =
  | 'editorialConsensus'
  | 'learningLeverage'
  | 'preparationFit'
  | 'difficultyFit'
  | 'durability';

export interface CatalogBook {
  id: string;
  title?: string;
  author?: string;
  categories?: readonly string[];
  collectionIds?: readonly string[];
  years?: readonly number[];
}

export interface ReadingGuideLink { id: string; reason?: string }
export interface ReadingGuideRoute {
  category?: string;
  heading?: string;
  goal?: string;
  books: readonly string[];
  /** Why each book follows the previous step, keyed by the later book's id. */
  reasons?: Readonly<Record<string, string>>;
}

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

/** Children's books are read by a different reader, so they are compared and
 * ranked among themselves; every other book belongs to the general audience. */
export type ReadingAudience = 'general' | 'children';

export interface MaturityThreshold {
  level: ReadinessLevel;
  /** Inclusive lower bound on the 0–100 score. */
  minScore: number;
  label: string;
}

export interface ReadingPriorityResult {
  bookId: string;
  audience: ReadingAudience;
  /** Dense, user-facing rank within the book's audience. Equal priority keys share the same rank. */
  rank: number;
  /** Stable, unique catalog position after deterministic tie-breaking; general books come first. */
  ordinal: number;
  score: number;
  confidence: number;
  maturity: ReadinessLevel;
  maturityLabel: string;
  criteria: CriterionResult[];
  reasons: string[];
  policyVersion: string;
}

export interface ReadingRankingPolicy {
  version: string;
  weights: Readonly<Record<CriterionId, number>>;
  /** Ordered from the highest level to the lowest. */
  maturity: readonly MaturityThreshold[];
}

export interface ReadingRankingSnapshot {
  version: string;
  generatedAt: string;
  ordered: ReadingPriorityResult[];
  byId: Record<string, ReadingPriorityResult>;
}
