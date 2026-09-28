import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import GitHubSyncPanel from '../../src/components/GitHubSyncPanel';
import SyncMergeDialog from '../../src/components/SyncMergeDialog';
import { renderWithTheme } from './render';

const sync = overrides => ({ status: 'ready', message: 'GitHub durumu güncel.', pending: 0, hasToken: false, saveToken: vi.fn(async () => {}), flush: vi.fn(async () => {}), load: vi.fn(), clearToken: vi.fn(), mergePrompt: null, resolveMerge: vi.fn(async () => {}), ...overrides });

describe('GitHubSyncPanel', () => {
  it('guides the reader to a fine-grained token limited to the state repository', () => {
    renderWithTheme(<GitHubSyncPanel sync={sync()}/>);
    const link = screen.getByRole('link', { name: /hazır ayarlarla oluştur/ });
    const url = new URL(link.getAttribute('href'));
    expect(url.origin + url.pathname).toBe('https://github.com/settings/personal-access-tokens/new');
    expect(url.searchParams.get('target_name')).toBe('karacaismail');
    expect(url.searchParams.get('contents')).toBe('write');
    expect(Number(url.searchParams.get('expires_in'))).toBeLessThanOrEqual(90);
    expect(screen.getByText(/Only select repositories/)).toBeTruthy();
    expect(screen.getByText(/Klasik ve OAuth anahtarları kabul edilmez/)).toBeTruthy();
    expect(screen.getByText(/aynı tarayıcı alanını paylaştığı/)).toBeTruthy();
  });

  it('sends the entered token to validation and clears the field', async () => {
    const value = sync();
    renderWithTheme(<GitHubSyncPanel sync={value}/>);
    const input = screen.getByLabelText(/İnce ayarlı \(fine-grained\) GitHub anahtarı/);
    fireEvent.change(input, { target: { value: 'github_pat_TEST_ONLY_not_a_real_token_for_unit_tests' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bu cihazda bağla' }));
    await vi.waitFor(() => expect(value.saveToken).toHaveBeenCalledWith('github_pat_TEST_ONLY_not_a_real_token_for_unit_tests'));
    await vi.waitFor(() => expect(input.value).toBe(''));
  });

  it('offers flush, reload and removal once connected', () => {
    renderWithTheme(<GitHubSyncPanel sync={sync({ hasToken: true })}/>);
    expect(screen.getByRole('button', { name: 'Şimdi gönder' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Anahtarı kaldır' })).toBeTruthy();
    expect(screen.queryByLabelText(/GitHub anahtarı/)).toBeNull();
  });
});

describe('SyncMergeDialog', () => {
  it('stays hidden without a decision to make', () => {
    renderWithTheme(<SyncMergeDialog sync={sync()}/>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lets the reader keep either side and passes the choice on', async () => {
    const value = sync({ mergePrompt: { conflicts: ['a', 'b'], queueConflict: true } });
    renderWithTheme(<SyncMergeDialog sync={value}/>);
    expect(await screen.findByText(/2 kitabın kaydı ve okuma sıran/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'GitHub’dakini kullan' }));
    await vi.waitFor(() => expect(value.resolveMerge).toHaveBeenCalledWith('shared'));
  });
});
