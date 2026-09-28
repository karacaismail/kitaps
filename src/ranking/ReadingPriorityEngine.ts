import { CRITERION_LABELS, DEFAULT_READING_POLICY } from './policy.ts';
import type {
  Catalog,
  CatalogBook,
  CriterionId,
  CriterionResult,
  RankingContext,
  ReadingPriorityResult,
  ReadingRankingPolicy,
  ReadingRankingSnapshot,
  ReadinessLevel,
} from './types.ts';

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

type ReadingStatus = ReadingPriorityResult['signals']['readingStatus'];
type RawCriteria = Record<CriterionId, number>;

interface RawAssessment {
  book: CatalogBook;
  raw: RawCriteria;
  confidence: Record<CriterionId, number>;
  user: UserBookState;
}

interface ScoredAssessment extends ReadingPriorityResult {
  priorityBand: number;
}

/**
 * Keeps ownership separate from reading status. A borrowed book may be in
 * progress, and a previously read book does not need to be owned.
 */
export class UserBookState {
  readonly bookId: string;
  readonly owned: boolean;
  readonly status: ReadingStatus;
  readonly queuePosition: number | null;

  constructor(
    bookId: string,
    context: RankingContext,
    queuePositions?: ReadonlyMap<string, number>,
  ) {
    this.bookId = bookId;
    const states = new Set(context.states[bookId] ?? []);
    this.owned = states.has('alindi');
    this.status = this.resolveReadingStatus(states);
    const position = queuePositions?.get(bookId);
    if (position !== undefined) {
      this.queuePosition = position;
    } else if (queuePositions) {
      this.queuePosition = null;
    } else {
      const queueIndex = context.queue.indexOf(bookId);
      this.queuePosition = queueIndex < 0 ? null : queueIndex + 1;
    }
  }

  private resolveReadingStatus(
    states: ReadonlySet<string>,
  ): ReadingStatus {
    if (states.has('okunuyor')) return 'reading';
    if (states.has('araverildi')) return 'paused';
    if (states.has('okundu')) return 'read';
    if (states.has('birakildi')) return 'abandoned';
    return 'unread';
  }
}

/** Catalog-derived facts. Rebuilt when an engine is created with a catalog. */
export class CatalogReadingProfile {
  private readonly leverage = new Map<string, number>();
  private readonly categoryTotals = new Map<string, number>();
  private readonly maxCollections: number;
  private readonly maxLeverage: number;

  constructor(catalog: Catalog) {
    this.maxCollections = Math.max(
      1,
      ...catalog.books.map((book) => book.collectionIds?.length ?? 0),
    );

    for (const book of catalog.books) {
      this.leverage.set(book.id, 0);
      for (const category of book.categories ?? []) {
        this.categoryTotals.set(
          category,
          (this.categoryTotals.get(category) ?? 0) + 1,
        );
      }
    }

    for (const route of catalog.readingGuides?.routes ?? []) {
      route.books.forEach((id, index) => {
        const unlocks = Math.max(0, route.books.length - index - 1);
        this.leverage.set(id, (this.leverage.get(id) ?? 0) + unlocks);
      });
    }

    for (const links of Object.values(catalog.readingGuides?.overrides ?? {})) {
      for (const item of [...(links.before ?? []), ...(links.after ?? [])]) {
        this.leverage.set(item.id, (this.leverage.get(item.id) ?? 0) + 1);
      }
    }

    this.maxLeverage = Math.max(1, ...this.leverage.values());
  }

  assess(
    book: CatalogBook,
    context: RankingContext,
    ownedByCategory: ReadonlyMap<string, number>,
    queuePositions: ReadonlyMap<string, number>,
  ): RawAssessment {
    const user = new UserBookState(book.id, context, queuePositions);
    return {
      book,
      user,
      raw: {
        editorialConsensus: this.editorialConsensus(book),
        learningLeverage: this.learningLeverage(book),
        accessReadiness: this.accessReadiness(user),
        readingMomentum: this.readingMomentum(user),
        queueCommitment: this.queueCommitment(user, context.queue.length),
        collectionCoverage: this.collectionCoverage(book, user, ownedByCategory),
        difficultyFit: this.difficultyFit(book),
        durability: this.durability(book),
      },
      confidence: this.criterionConfidence(book, user),
    };
  }

  evidence(
    id: CriterionId,
    assessment: RawAssessment,
    normalized: number,
  ): string {
    const { book, user } = assessment;
    const percent = Math.round(normalized * 100);

    switch (id) {
      case 'editorialConsensus':
        return `${book.collectionIds?.length ?? 0} bağımsız seçkide yer alıyor; güncel kataloğa göre %${percent}.`;
      case 'learningLeverage':
        return `Okuma rotalarında sonraki kitapları açma değeri %${percent}.`;
      case 'accessReadiness':
        if (user.owned && user.status === 'unread') {
          return 'Kitap sahip olunanlar arasında ve henüz okunmadı; erişim engeli yok.';
        }
        if (!user.owned && user.status === 'read') {
          return 'Kitap daha önce okundu ve sahip olunanlar arasında değil; yeniden okuma önceliği düşük.';
        }
        if (user.owned) {
          return 'Kitap sahip olunanlar arasında; okuma durumuyla bağımsız değerlendirildi.';
        }
        return 'Kitap sahip olunanlar arasında değil; okuma için önce erişim gerekebilir.';
      case 'readingMomentum':
        return `Okuma durumu: ${this.statusLabel(user.status)}; ivme değeri %${percent}.`;
      case 'queueCommitment':
        return user.queuePosition === null
          ? 'Kişisel okuma sırasında değil.'
          : `Kişisel okuma sırasında ${user.queuePosition}. konumda.`;
      case 'collectionCoverage':
        return `Sahip olunan kitapların konu boşluğunu kapatma değeri %${percent}.`;
      case 'difficultyFit':
        return `Türetilmiş zorluk ${this.difficulty(book)}/5; sürdürülebilir okuma eşiğine uyum %${percent}.`;
      case 'durability':
        return `Güncellik ve kalıcı ilke dengesi %${percent}.`;
    }
  }

  private editorialConsensus(book: CatalogBook): number {
    return Math.log2(1 + (book.collectionIds?.length ?? 0))
      / Math.log2(1 + this.maxCollections);
  }

  private learningLeverage(book: CatalogBook): number {
    return (this.leverage.get(book.id) ?? 0) / this.maxLeverage;
  }

  private accessReadiness(user: UserBookState): number {
    if (user.owned && user.status === 'unread') return 1;
    if (user.owned && user.status === 'reading') return 0.95;
    if (user.status === 'reading') return 0.78;
    if (user.owned && user.status === 'paused') return 0.75;
    if (user.owned && user.status === 'read') return 0.24;
    if (user.owned) return 0.65;
    if (user.status === 'paused') return 0.45;
    if (user.status === 'read') return 0.05;
    if (user.status === 'abandoned') return 0.08;
    return 0.30;
  }

  private readingMomentum(user: UserBookState): number {
    if (user.status === 'reading') return 1;
    if (user.status === 'paused') return 0.62;
    if (user.status === 'unread') return 0.40;
    if (user.status === 'read') return 0.08;
    return 0;
  }

  private queueCommitment(user: UserBookState, queueLength: number): number {
    if (user.queuePosition === null || queueLength < 1) return 0;
    if (queueLength === 1) return 1;
    return 1 - (user.queuePosition - 1) / queueLength * 0.55;
  }

  private collectionCoverage(
    book: CatalogBook,
    user: UserBookState,
    ownedByCategory: ReadonlyMap<string, number>,
  ): number {
    const categories = book.categories ?? [];
    if (categories.length === 0) return 0.5;

    return categories.reduce((sum, category) => {
      const otherCandidates = Math.max(
        1,
        (this.categoryTotals.get(category) ?? 1) - 1,
      );
      // A candidate must not count as already-covered merely because the user
      // owns that same candidate. Only other owned books cover its topic.
      const otherOwned = Math.max(
        0,
        (ownedByCategory.get(category) ?? 0) - (user.owned ? 1 : 0),
      );
      return sum + 1 - clamp(otherOwned / otherCandidates);
    }, 0) / categories.length;
  }

  private difficulty(book: CatalogBook): number {
    const hard = new Set(['finance', 'economy', 'science', 'technology', 'philosophy', 'systems']);
    const easy = new Set(['children', 'literature', 'biography', 'productivity']);
    let value = 3;
    if ((book.categories ?? []).some((id) => hard.has(id))) value += 1;
    if ((book.categories ?? []).some((id) => easy.has(id))) value -= 1;
    if ((book.collectionIds ?? []).includes('mit')) value += 1;
    return Math.max(1, Math.min(5, value));
  }

  private difficultyFit(book: CatalogBook): number {
    return 1 - Math.abs(this.difficulty(book) - 3) / 4;
  }

  private durability(book: CatalogBook): number {
    const latest = Math.max(0, ...(book.years ?? []));
    const tactical = (book.categories ?? [])
      .some((id) => ['technology', 'marketing'].includes(id));
    if (!latest) return 0.55;
    if (!tactical) return 0.85;
    return clamp(0.35 + (latest - 1990) / 60);
  }

  private criterionConfidence(
    book: CatalogBook,
    user: UserBookState,
  ): Record<CriterionId, number> {
    const hasCategories = (book.categories?.length ?? 0) > 0;
    const hasCollections = (book.collectionIds?.length ?? 0) > 0;
    const hasYear = (book.years?.length ?? 0) > 0;
    const explicitUserSignal = user.owned
      || user.status !== 'unread'
      || user.queuePosition !== null;

    return {
      editorialConsensus: hasCollections ? 1 : 0.55,
      learningLeverage: 0.9,
      accessReadiness: explicitUserSignal ? 1 : 0.8,
      readingMomentum: explicitUserSignal ? 1 : 0.8,
      queueCommitment: 1,
      collectionCoverage: hasCategories ? 0.95 : 0.55,
      difficultyFit: hasCategories ? 0.8 : 0.5,
      durability: hasYear ? 0.9 : 0.5,
    };
  }

  private statusLabel(status: ReadingStatus): string {
    return {
      unread: 'okunmadı',
      reading: 'okunuyor',
      paused: 'ara verildi',
      read: 'okundu',
      abandoned: 'bırakıldı',
    }[status];
  }
}

/** Min-max normalization is recomputed for the books in every rank call. */
export class CatalogNormalizer {
  normalize(assessments: readonly RawAssessment[]): Map<string, RawCriteria> {
    const result = new Map<string, RawCriteria>();
    const ids = Object.keys(DEFAULT_READING_POLICY.weights) as CriterionId[];
    const catalogRelative = new Set<CriterionId>([
      'editorialConsensus',
      'learningLeverage',
      'collectionCoverage',
      'difficultyFit',
      'durability',
    ]);

    for (const assessment of assessments) {
      result.set(assessment.book.id, {} as RawCriteria);
    }

    for (const id of ids) {
      const values = assessments.map((assessment) => assessment.raw[id]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      for (const assessment of assessments) {
        // Personal signals have absolute meaning: a currently-read book must
        // not lose its momentum merely because another book is also active.
        // Catalog facts remain relative and react to additions/removals.
        const normalized = !catalogRelative.has(id)
          ? clamp(assessment.raw[id])
          : max === min
          ? clamp(assessment.raw[id])
          : clamp((assessment.raw[id] - min) / (max - min));
        result.get(assessment.book.id)![id] = normalized;
      }
    }

    return result;
  }
}

export class ReadingPriorityEngine {
  private readonly catalog: Catalog;
  private readonly policy: ReadingRankingPolicy;
  private readonly profile: CatalogReadingProfile;
  private readonly normalizer = new CatalogNormalizer();

  constructor(catalog: Catalog, policy: ReadingRankingPolicy = DEFAULT_READING_POLICY) {
    this.catalog = catalog;
    this.policy = policy;
    this.profile = new CatalogReadingProfile(catalog);
  }

  rank(context: RankingContext): ReadingPriorityResult[] {
    if (this.catalog.books.length === 0) return [];

    const ownedByCategory = this.ownedCategoryCounts(context);
    const queuePositions = new Map<string, number>();
    context.queue.forEach((bookId, index) => {
      if (!queuePositions.has(bookId)) queuePositions.set(bookId, index + 1);
    });
    const assessments = this.catalog.books
      .map((book) => this.profile.assess(
        book,
        context,
        ownedByCategory,
        queuePositions,
      ));
    const normalized = this.normalizer.normalize(assessments);
    const scored = assessments.map((assessment) =>
      this.score(assessment, normalized.get(assessment.book.id)!),
    );

    scored.sort((a, b) =>
      b.priorityBand - a.priorityBand
      || b.score - a.score
      || b.confidence - a.confidence
      || a.bookId.localeCompare(b.bookId, 'tr'),
    );

    let denseRank = 0;
    let previousKey = '';
    return scored.map((result, index) => {
      const key = `${result.priorityBand}:${result.score}`;
      if (key !== previousKey) {
        denseRank += 1;
        previousKey = key;
      }
      const { priorityBand: _priorityBand, ...publicResult } = result;
      return { ...publicResult, rank: denseRank, ordinal: index + 1 };
    });
  }

  private ownedCategoryCounts(context: RankingContext): Map<string, number> {
    const counts = new Map<string, number>();
    for (const book of this.catalog.books) {
      if (!(context.states[book.id] ?? []).includes('alindi')) continue;
      for (const category of book.categories ?? []) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return counts;
  }

  private score(
    assessment: RawAssessment,
    normalized: RawCriteria,
  ): ScoredAssessment {
    const criteria = (Object.keys(this.policy.weights) as CriterionId[])
      .map((id): CriterionResult => {
        const weight = this.policy.weights[id];
        return {
          id,
          label: CRITERION_LABELS[id],
          raw: round(assessment.raw[id], 3),
          normalized: round(normalized[id], 3),
          weight,
          points: round(normalized[id] * weight * 100, 2),
          confidence: round(assessment.confidence[id] * 100, 0),
          evidence: this.profile.evidence(id, assessment, normalized[id]),
        };
      });

    const score = (Object.keys(this.policy.weights) as CriterionId[])
      .reduce((sum, id) => sum + normalized[id] * this.policy.weights[id] * 100, 0);
    const confidence = criteria.reduce(
      (sum, criterion) => sum + criterion.confidence * criterion.weight,
      0,
    );
    const readiness = this.readiness(score, assessment.user);
    const reasons = [...criteria]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map((criterion) =>
        `${criterion.label}: ${criterion.points.toFixed(2)} puan. ${criterion.evidence}`,
      );

    return {
      bookId: assessment.book.id,
      rank: 0,
      ordinal: 0,
      score: round(score, 2),
      confidence: round(confidence, 0),
      maturity: readiness.level,
      maturityLabel: readiness.label,
      criteria,
      reasons,
      policyVersion: this.policy.version,
      priorityBand: this.priorityBand(assessment.user),
      signals: {
        owned: assessment.user.owned,
        readingStatus: assessment.user.status,
        queuePosition: assessment.user.queuePosition,
      },
    };
  }

  private priorityBand(user: UserBookState): number {
    if (user.status === 'reading') return 4;
    if (
      user.queuePosition !== null
      && user.status !== 'read'
      && user.status !== 'abandoned'
    ) return 3;
    if (user.status === 'unread' || user.status === 'paused') return 2;
    return 1;
  }

  private readiness(
    score: number,
    user: UserBookState,
  ): { level: ReadinessLevel; label: string } {
    if (user.status === 'reading') return { level: 5, label: 'Okumaya devam et' };
    if (user.status === 'read') return { level: 1, label: 'Yeniden okuma düşük öncelik' };
    if (user.status === 'abandoned') return { level: 1, label: 'Yeniden değerlendirme gerekli' };
    if (user.queuePosition === 1) return { level: 5, label: 'Sıradaki kitap' };
    if (score >= 72) return { level: 5, label: 'Şimdi oku' };
    if (score >= 58) return { level: 4, label: 'Yüksek okuma önceliği' };
    if (score >= 43) return { level: 3, label: 'Orta okuma önceliği' };
    if (score >= 28) return { level: 2, label: 'Bağlama bağlı' };
    return { level: 1, label: 'Düşük okuma önceliği' };
  }
}

export class ReadingRankingViewModel {
  private readonly engine: ReadingPriorityEngine;
  private readonly now: () => Date;
  constructor(engine: ReadingPriorityEngine, now: () => Date = () => new Date()) {this.engine=engine;this.now=now;}

  build(context: RankingContext): ReadingRankingSnapshot {
    const ordered = this.engine.rank(context);
    return {
      version: ordered[0]?.policyVersion ?? DEFAULT_READING_POLICY.version,
      generatedAt: this.now().toISOString(),
      ordered,
      byId: Object.fromEntries(
        ordered.map((item) => [item.bookId, item]),
      ),
    };
  }
}
