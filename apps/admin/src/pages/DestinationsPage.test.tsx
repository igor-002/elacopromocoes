import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DestinationsPage } from './DestinationsPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DestinationsPage', () => {
  it('carrega os grupos da Evolution e preenche o nome do destino', async () => {
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith('/destinations/evolution/status')) {
        return Promise.resolve(json({ status: 'connected', instance: 'radar' }));
      }
      if (url.endsWith('/destinations/evolution/groups')) {
        return Promise.resolve(json([{ id: '123@g.us', name: 'Ofertas Elaco' }]));
      }
      return Promise.resolve(json([]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <DestinationsPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Novo destino' }));
    await user.click(screen.getByRole('button', { name: /WhatsApp/ }));
    const groupSelect = await screen.findByLabelText('Grupo do WhatsApp');
    await user.selectOptions(groupSelect, '123@g.us');

    expect(groupSelect).toHaveValue('123@g.us');
    expect(screen.getByLabelText('Nome para identificar')).toHaveValue('Ofertas Elaco');
  });
});
