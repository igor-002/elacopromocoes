import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('cliente da API', () => {
  it('envia cookies e serializa o corpo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.post('/destinations/1/test', { sample: true })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/destinations/1/test', expect.objectContaining({
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ sample: true }),
    }));
  });

  it('converte falhas HTTP em erro legível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Sessão expirada' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })));

    await expect(api.get('/auth/session')).rejects.toMatchObject({
      message: 'Sessão expirada',
      status: 401,
    } satisfies Partial<ApiError>);
  });
});
