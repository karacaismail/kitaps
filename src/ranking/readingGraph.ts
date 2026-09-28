import type { Catalog, ReadingGuideRoute } from './types.ts';

export type ReadingLinkSource = 'editorial' | 'route';

export interface ReadingLink {
  id: string;
  /** Why the link is suggested, written for the book page that shows it. */
  reason?: string;
  source: ReadingLinkSource;
  route?: { category?: string; heading?: string };
}

export interface ReadingRelations {
  before: ReadingLink[];
  after: ReadingLink[];
  companions: ReadingLink[];
}

type LinkTable = Map<string, Map<string, ReadingLink>>;

/** The one preparation graph behind both the ranking engine and the book page,
 * so a prerequisite count and the suggestions shown beside it cannot disagree.
 * Editorial links are made reciprocal; category routes add only their
 * consecutive steps, never every earlier book of the route. */
export class ReadingGraph {
  private readonly before: LinkTable = new Map();
  private readonly after: LinkTable = new Map();
  private readonly companions: LinkTable = new Map();

  constructor(catalog: Catalog) {
    for (const book of catalog.books) {
      this.before.set(book.id, new Map());
      this.after.set(book.id, new Map());
      this.companions.set(book.id, new Map());
    }

    // Editorial links come first so their reasons outrank route defaults.
    for (const [bookId, links] of Object.entries(catalog.readingGuides?.overrides ?? {})) {
      for (const link of links.before ?? []) this.addEdge(link.id, bookId, 'editorial', { before: link.reason });
      for (const link of links.after ?? []) this.addEdge(bookId, link.id, 'editorial', { after: link.reason });
      for (const link of links.companions ?? []) this.addCompanion(bookId, link.id, link.reason);
    }
    for (const route of catalog.readingGuides?.routes ?? []) {
      for (let index = 1; index < route.books.length; index += 1) {
        const reason = route.reasons?.[route.books[index]];
        this.addEdge(route.books[index - 1], route.books[index], 'route', { before: reason, after: reason }, route);
      }
    }
  }

  relations(bookId: string): ReadingRelations {
    const before = [...(this.before.get(bookId)?.values() ?? [])];
    const after = [...(this.after.get(bookId)?.values() ?? [])];
    const ordered = new Set([...before, ...after].map((link) => link.id));
    const companions = [...(this.companions.get(bookId)?.values() ?? [])]
      .filter((link) => !ordered.has(link.id));
    return { before, after, companions };
  }

  prerequisiteCount(bookId: string): number {
    return this.before.get(bookId)?.size ?? 0;
  }

  unlockCount(bookId: string): number {
    return this.after.get(bookId)?.size ?? 0;
  }

  companionCount(bookId: string): number {
    return this.relations(bookId).companions.length;
  }

  private addEdge(
    from: string,
    to: string,
    source: ReadingLinkSource,
    reasons: { before?: string; after?: string },
    route?: ReadingGuideRoute,
  ): void {
    if (from === to || !this.after.has(from) || !this.before.has(to)) return;
    // Keep the graph acyclic: a later, weaker link never closes a loop through
    // earlier ones, however many routes the loop would pass through.
    if (this.reaches(to, from)) return;
    const routeInfo = route ? { category: route.category, heading: route.heading } : undefined;
    this.upsert(this.before.get(to)!, from, source, reasons.before, routeInfo);
    this.upsert(this.after.get(from)!, to, source, reasons.after, routeInfo);
  }

  /** True when `target` can already be read after `start` along existing links. */
  private reaches(start: string, target: string): boolean {
    const stack = [start];
    const seen = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (id === target) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const next of this.after.get(id)?.keys() ?? []) stack.push(next);
    }
    return false;
  }

  private addCompanion(left: string, right: string, reason?: string): void {
    if (left === right || !this.companions.has(left) || !this.companions.has(right)) return;
    this.upsert(this.companions.get(left)!, right, 'editorial', reason);
    this.upsert(this.companions.get(right)!, left, 'editorial', reason);
  }

  private upsert(
    table: Map<string, ReadingLink>,
    id: string,
    source: ReadingLinkSource,
    reason?: string,
    route?: ReadingLink['route'],
  ): void {
    const existing = table.get(id);
    if (!existing) {
      table.set(id, { id, source, ...(reason ? { reason } : {}), ...(route ? { route } : {}) });
      return;
    }
    if (!existing.reason && reason) existing.reason = reason;
    if (existing.source === 'route' && source === 'editorial') existing.source = 'editorial';
  }
}

const graphs = new WeakMap<Catalog, ReadingGraph>();

/** Shares one graph per catalog object between the engine and the views. */
export function readingGraphFor(catalog: Catalog): ReadingGraph {
  let graph = graphs.get(catalog);
  if (!graph) {
    graph = new ReadingGraph(catalog);
    graphs.set(catalog, graph);
  }
  return graph;
}
