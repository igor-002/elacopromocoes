import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeliveryService } from './delivery.service';

const evolutionSettings: Record<string, string> = {
  EVOLUTION_API_URL: 'http://evolution-api:8080/',
  EVOLUTION_API_KEY: 'secret-key',
  EVOLUTION_INSTANCE: 'radar',
};

function service(settings: Record<string, string | undefined> = evolutionSettings) {
  const config = { get: (key: string) => settings[key] } as ConfigService;
  return new DeliveryService(config);
}

afterEach(() => vi.unstubAllGlobals());

describe('DeliveryService Evolution API', () => {
  it('indica quando a integração não está configurada sem fazer requisição', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(service({}).getEvolutionStatus()).resolves.toEqual({
      status: 'disabled',
      instance: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('expõe a conexão real da instância sem revelar a chave', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ instance: { instanceName: 'radar', state: 'open' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(service().getEvolutionStatus()).resolves.toEqual({
      status: 'connected',
      instance: 'radar',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://evolution-api:8080/instance/connectionState/radar',
      expect.objectContaining({ headers: { apikey: 'secret-key' } }),
    );
  });

  it('lista somente grupos válidos e ordena pelo nome', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ instance: { state: 'open' } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: '222@g.us', subject: 'Zeta' },
            { id: 'contato@s.whatsapp.net', subject: 'Contato' },
            { id: '111@g.us', subject: 'Alpha' },
          ]),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(service().listEvolutionGroups()).resolves.toEqual([
      { id: '111@g.us', name: 'Alpha' },
      { id: '222@g.us', name: 'Zeta' },
    ]);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://evolution-api:8080/group/fetchAllGroups/radar?getParticipants=false',
    );
  });
});
