import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Destination, Offer } from '@prisma/client';
import { formatPublicationMessage } from './message-template';

export class DeliveryUnknownError extends Error {}

export interface DeliveryResult {
  externalMessageId: string | null;
}

@Injectable()
export class DeliveryService {
  constructor(private readonly config: ConfigService) {}

  send(destination: Destination, offer: Offer): Promise<DeliveryResult> {
    return destination.channel === 'TELEGRAM'
      ? this.sendTelegram(destination.externalId, offer)
      : this.sendEvolution(destination.externalId, offer);
  }

  async test(destination: Destination): Promise<DeliveryResult> {
    const text = '✅ Destino conectado ao Radar de Ofertas.';
    return destination.channel === 'TELEGRAM'
      ? this.telegramRequest('sendMessage', { chat_id: destination.externalId, text })
      : this.evolutionRequest('sendText', { number: destination.externalId, text });
  }

  isTelegramConfigured(): boolean {
    return Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN'));
  }

  isEvolutionConfigured(): boolean {
    return Boolean(
      this.config.get<string>('EVOLUTION_API_URL') &&
        this.config.get<string>('EVOLUTION_API_KEY') &&
        this.config.get<string>('EVOLUTION_INSTANCE'),
    );
  }

  private async sendTelegram(chatId: string, offer: Offer): Promise<DeliveryResult> {
    const caption = formatPublicationMessage(offer);
    return offer.imageUrl
      ? this.telegramRequest('sendPhoto', { chat_id: chatId, photo: offer.imageUrl, caption })
      : this.telegramRequest('sendMessage', { chat_id: chatId, text: caption });
  }

  private async telegramRequest(method: string, body: Record<string, unknown>): Promise<DeliveryResult> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new BadGatewayException('TELEGRAM_BOT_TOKEN não configurado.');

    const payload = await requestJson(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = payload as { ok?: boolean; result?: { message_id?: number }; description?: string };
    if (!result.ok) throw new Error(result.description || 'Telegram recusou a mensagem.');
    return { externalMessageId: result.result?.message_id?.toString() ?? null };
  }

  private async sendEvolution(groupId: string, offer: Offer): Promise<DeliveryResult> {
    const caption = formatPublicationMessage(offer);
    return offer.imageUrl
      ? this.evolutionRequest('sendMedia', {
          number: groupId,
          mediatype: 'image',
          mimetype: 'image/jpeg',
          media: offer.imageUrl,
          caption,
        })
      : this.evolutionRequest('sendText', { number: groupId, text: caption });
  }

  private async evolutionRequest(method: string, body: Record<string, unknown>): Promise<DeliveryResult> {
    const baseUrl = this.config.get<string>('EVOLUTION_API_URL')?.replace(/\/+$/, '');
    const apiKey = this.config.get<string>('EVOLUTION_API_KEY');
    const instance = this.config.get<string>('EVOLUTION_INSTANCE');
    if (!baseUrl || !apiKey || !instance) {
      throw new BadGatewayException('Evolution API não configurada.');
    }

    const payload = await requestJson(`${baseUrl}/message/${method}/${encodeURIComponent(instance)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: apiKey },
      body: JSON.stringify(body),
    });
    const result = payload as { key?: { id?: string }; messageId?: string; id?: string };
    return { externalMessageId: result.key?.id ?? result.messageId ?? result.id ?? null };
  }
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text.slice(0, 300) };
    }
    if (!response.ok) {
      const detail =
        typeof payload === 'object' && payload && 'message' in payload
          ? String(payload.message).slice(0, 300)
          : `HTTP ${response.status}`;
      throw new Error(`Falha na integração (${response.status}): ${detail}`);
    }
    return payload;
  } catch (error) {
    if (error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name)) {
      throw new DeliveryUnknownError('Tempo limite; entrega pode ter ocorrido.');
    }
    throw error;
  }
}
