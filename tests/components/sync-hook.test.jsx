import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGitHubStateSync, readSyncBackup } from '../../src/state/useGitHubStateSync';

const remoteDocument = (books, queue = null) => ({ schemaVersion: 2, updatedAt: '2026-09-28T10:00:00.000Z', books, queue });
const record = value => ({ updatedAt: '2026-09-28T10:00:00.000Z', value });
const BOOK_IDS = ['a', 'b', 'c'];
const pending = () => JSON.parse(localStorage.getItem('kitapatlasi:github-state:pending:v2') || '{"mutations":[]}').mutations;
// Deliberately not shaped like a real token so secret scanners stay quiet.
const TOKEN = 'github_pat_TEST_ONLY_not_a_real_token_for_unit_tests';

/** A stand-in for GitHub: the CDN copy, the Contents API, the blob probe and saves.
 * `puts` lists answers for successive saves (default 200); `gate` holds saves until released. */
function github(remote, { blob = 201, puts = [] } = {}) {
  const calls = [];
  let release = null;
  const server = { calls, current: () => remote, hold() { let open; const gate = new Promise(resolve => { open = resolve; }); release = { gate, open }; return () => open(); } };
  server.fetch = vi.fn(async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', init });
    if (url.startsWith('https://raw.')) return new Response(JSON.stringify(remote));
    if (url.endsWith('/git/blobs')) return new Response('{}', { status: blob });
    if (init.method === 'PUT') {
      if (release) { const { gate } = release; release = null; await gate; }
      const status = puts.shift() ?? 200;
      if (status !== 200) return new Response('{}', { status });
      remote = JSON.parse(atob(JSON.parse(init.body).content));
      return new Response('{}', { status: 200 });
    }
    return new Response(JSON.stringify({ sha: 'sha-1', encoding: 'base64', content: btoa(JSON.stringify(remote)) }));
  });
  return server;
}
const putsOf = server => server.calls.filter(call => call.method === 'PUT');

const hidePage = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
};

function useHarness(initialStates, initialPersonal) {
  const [states, setStates] = useState(initialStates);
  const [personal, setPersonal] = useState(initialPersonal);
  const sync = useGitHubStateSync({ bookIds: BOOK_IDS, states, setStates, personal, setPersonal });
  return { sync, states, setStates, personal };
}

describe('useGitHubStateSync on a device that has never synced', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('adds device-only records, and asks before touching a record both sides changed', async () => {
    vi.stubGlobal('fetch', github(remoteDocument({ a: record({ states: ['okundu'] }) })).fetch);
    const { result } = renderHook(() => useHarness({ a: ['onemli'], b: ['alindi'] }, { queue: ['b'], reading: {} }));
    await waitFor(() => expect(result.current.sync.mergePrompt).toEqual({ conflicts: ['a'], queueConflict: false }));
    expect(result.current.states.a).toEqual(['onemli']);
    expect(pending().map(item => item.kind === 'queue' ? 'queue' : item.bookId).sort()).toEqual(['b', 'queue']);
    expect(readSyncBackup().states).toEqual({ a: ['onemli'], b: ['alindi'] });
    expect(localStorage.getItem('kitapatlasi:github-state:migrated:v1')).toBeNull();

    await act(() => result.current.sync.resolveMerge('shared'));
    expect(result.current.states.a).toEqual(['okundu']);
    expect(result.current.states.b).toEqual(['alindi']);
    expect(result.current.sync.mergePrompt).toBeNull();
    expect(pending().some(item => item.bookId === 'a')).toBe(false);
    expect(localStorage.getItem('kitapatlasi:github-state:migrated:v1')).toBe('1');
  });

  it('keeps this device’s value and queues it when the reader chooses so', async () => {
    vi.stubGlobal('fetch', github(remoteDocument({ a: record({ states: ['okundu'] }) }, { updatedAt: '2026-09-28T10:00:00.000Z', value: ['c'] })).fetch);
    const { result } = renderHook(() => useHarness({ a: ['onemli'] }, { queue: ['a'], reading: {} }));
    await waitFor(() => expect(result.current.sync.mergePrompt).toEqual({ conflicts: ['a'], queueConflict: true }));
    await act(() => result.current.sync.resolveMerge('device'));
    expect(result.current.states.a).toEqual(['onemli']);
    expect(result.current.personal.queue).toEqual(['a']);
    const queued = pending();
    expect(queued.find(item => item.bookId === 'a').value.states).toEqual(['onemli']);
    expect(queued.find(item => item.kind === 'queue').value).toEqual(['a']);
  });

  it('seeds an empty shared file without asking', async () => {
    vi.stubGlobal('fetch', github(remoteDocument({})).fetch);
    const { result } = renderHook(() => useHarness({ a: ['onemli'] }, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).not.toBe('loading'));
    expect(result.current.sync.mergePrompt).toBeNull();
    expect(pending().map(item => item.bookId)).toEqual(['a']);
    expect(localStorage.getItem('kitapatlasi:github-state:migrated:v1')).toBe('1');
    expect(result.current.sync.message).toMatch(/bu cihazı bağla/);
  });

  it('opens with a fresh API copy, and reads the CDN with a simple request when GitHub refuses', async () => {
    const fetch = vi.fn(async url => url.startsWith('https://raw.')
      ? new Response(JSON.stringify(remoteDocument({})))
      : new Response('{}', { status: 403, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '4102444800' } }));
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    const [[apiUrl, apiInit], [cdnUrl, cdnInit]] = fetch.mock.calls;
    expect(apiUrl).toMatch(/^https:\/\/api\.github\.com\/repos\/karacaismail\/kitaps-state\/contents\/state\.json/);
    expect(apiInit.headers.Authorization).toBeUndefined();
    expect(cdnUrl).toBe('https://raw.githubusercontent.com/karacaismail/kitaps-state/main/state.json');
    expect(cdnInit.headers).toBeUndefined();
  });
});

describe('useGitHubStateSync getting changes off the device', () => {
  beforeEach(() => { localStorage.clear(); localStorage.setItem('kitapatlasi:github-state:migrated:v1', '1'); });
  afterEach(() => { vi.unstubAllGlobals(); delete document.visibilityState; });

  it('a connected device sends a waiting change as soon as the page is hidden', async () => {
    localStorage.setItem('kitapatlasi:github-state:token:v1', TOKEN);
    const server = github(remoteDocument({}));
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    act(() => result.current.setStates({ a: ['alindi'] }));
    await waitFor(() => expect(result.current.sync.pending).toBe(1));
    expect(server.calls.some(call => call.method === 'PUT')).toBe(false);
    act(hidePage);
    await waitFor(() => expect(server.current().books.a?.value.states).toEqual(['alindi']));
    await waitFor(() => expect(result.current.sync.pending).toBe(0));
  });

  it('connecting a device sends the changes that waited on it right away', async () => {
    const server = github(remoteDocument({}));
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    act(() => result.current.setStates({ a: ['alindi'] }));
    await waitFor(() => expect(result.current.sync.message).toMatch(/bu cihazı bağla/));
    await act(() => result.current.sync.saveToken(TOKEN));
    await waitFor(() => expect(server.current().books.a?.value.states).toEqual(['alindi']));
    expect(server.calls.some(call => call.url.endsWith('/git/blobs'))).toBe(true);
    await waitFor(() => expect(result.current.sync.message).toBe('GitHub ile eşitlendi.'));
    expect(result.current.sync.pending).toBe(0);
  });

  it('connecting asks before replacing a book another device saved meanwhile, then sends the choice at once', async () => {
    // The phone bought the book while this device, not yet connected, marked it as being read.
    const server = github(remoteDocument({ a: { updatedAt: '2026-09-28T09:00:00.000Z', value: { states: ['alindi'] }, stamps: { states: '2026-09-28T09:00:00.000Z' } } }));
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    act(() => result.current.setStates({ a: ['okunuyor'], b: ['onemli'] }));
    await waitFor(() => expect(result.current.sync.pending).toBe(2));
    await act(() => result.current.sync.saveToken(TOKEN));
    await waitFor(() => expect(result.current.sync.mergePrompt).toEqual({ conflicts: ['a'], queueConflict: false }));
    expect(putsOf(server)).toHaveLength(0);
    expect(readSyncBackup().states.a).toEqual(['okunuyor']);
    // Hiding the page while the reader decides sends nothing.
    act(hidePage);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(putsOf(server)).toHaveLength(0);
    await act(() => result.current.sync.resolveMerge('shared'));
    await waitFor(() => expect(putsOf(server)).toHaveLength(1));
    expect(server.current().books.a.value.states).toEqual(['alindi']);
    expect(server.current().books.b.value.states).toEqual(['onemli']);
    expect(result.current.states.a).toEqual(['alindi']);
  });

  it('a change made while a write is under way gets its own write right after it', async () => {
    localStorage.setItem('kitapatlasi:github-state:token:v1', TOKEN);
    const server = github(remoteDocument({}));
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    act(() => result.current.setStates({ a: ['alindi'] }));
    await waitFor(() => expect(result.current.sync.pending).toBe(1));
    const open = server.hold();
    let first;
    act(() => { first = result.current.sync.flush(); });
    await waitFor(() => expect(putsOf(server)).toHaveLength(1));
    act(() => result.current.setStates({ a: ['alindi'], b: ['okundu'] }));
    await waitFor(() => expect(result.current.sync.pending).toBe(2));
    act(hidePage);
    open();
    await act(() => first);
    await waitFor(() => expect(server.current().books.b?.value.states).toEqual(['okundu']));
    expect(putsOf(server)).toHaveLength(2);
    await waitFor(() => expect(result.current.sync.pending).toBe(0));
  });

  it('a refused write is remembered for the notice until a write succeeds', async () => {
    localStorage.setItem('kitapatlasi:github-state:token:v1', TOKEN);
    const server = github(remoteDocument({}), { puts: [401] });
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    act(() => result.current.setStates({ a: ['alindi'] }));
    await waitFor(() => expect(result.current.sync.pending).toBe(1));
    await act(async () => { await result.current.sync.flush().catch(() => undefined); });
    expect(result.current.sync.writeError).toMatch(/GitHub anahtarı reddetti/);
    await act(async () => { await result.current.sync.flush(); });
    expect(result.current.sync.writeError).toBeNull();
    expect(server.current().books.a.value.states).toEqual(['alindi']);
  });

  it('a token that cannot write is not stored, and the reader is told why', async () => {
    const server = github(remoteDocument({}), { blob: 403 });
    vi.stubGlobal('fetch', server.fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    await act(async () => { await expect(result.current.sync.saveToken(TOKEN)).rejects.toMatchObject({ code: 'read-only' }); });
    expect(localStorage.getItem('kitapatlasi:github-state:token:v1')).toBeNull();
    expect(result.current.sync.message).toMatch(/yazamıyor/);
    expect(server.calls.some(call => call.method === 'PUT')).toBe(false);
  });
});
