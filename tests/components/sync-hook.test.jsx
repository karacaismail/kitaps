import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGitHubStateSync, readSyncBackup } from '../../src/state/useGitHubStateSync';

const remoteDocument = (books, queue = null) => ({ schemaVersion: 2, updatedAt: '2026-09-28T10:00:00.000Z', books, queue });
const record = value => ({ updatedAt: '2026-09-28T10:00:00.000Z', value });
const BOOK_IDS = ['a', 'b', 'c'];
const pending = () => JSON.parse(localStorage.getItem('kitapatlasi:github-state:pending:v2') || '{"mutations":[]}').mutations;

function useHarness(initialStates, initialPersonal) {
  const [states, setStates] = useState(initialStates);
  const [personal, setPersonal] = useState(initialPersonal);
  const sync = useGitHubStateSync({ bookIds: BOOK_IDS, states, setStates, personal, setPersonal });
  return { sync, states, personal };
}

describe('useGitHubStateSync on a device that has never synced', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('adds device-only records, and asks before touching a record both sides changed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(remoteDocument({ a: record({ states: ['okundu'] }) })))));
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
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(remoteDocument({ a: record({ states: ['okundu'] }) }, { updatedAt: '2026-09-28T10:00:00.000Z', value: ['c'] })))));
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
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(remoteDocument({})))));
    const { result } = renderHook(() => useHarness({ a: ['onemli'] }, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).not.toBe('loading'));
    expect(result.current.sync.mergePrompt).toBeNull();
    expect(pending().map(item => item.bookId)).toEqual(['a']);
    expect(localStorage.getItem('kitapatlasi:github-state:migrated:v1')).toBe('1');
    expect(result.current.sync.message).toMatch(/bu cihazı bağla/);
  });

  it('reads anonymously from the CDN with a simple request', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(remoteDocument({}))));
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useHarness({}, { queue: [], reading: {} }));
    await waitFor(() => expect(result.current.sync.status).toBe('ready'));
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://raw.githubusercontent.com/karacaismail/kitaps-state/main/state.json');
    expect(init.headers).toBeUndefined();
  });
});
