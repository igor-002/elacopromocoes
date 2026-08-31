import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GeneratedCopyDto } from '@radar/contracts';

export interface CopyOffer {
  title: string;
  currentPriceCents: number;
  originalPriceCents: number | null;
  coupon: string | null;
  category: string | null;
}

@Injectable()
export class CopyService {
  constructor(private readonly config: ConfigService) {}

  template(offer: CopyOffer): GeneratedCopyDto {
    const discount = discountPercent(offer.currentPriceCents, offer.originalPriceCents);
    const headline = discount
      ? `${offer.title} com ${discount}% de desconto`
      : `${offer.title} em oferta`;
    const coupon = offer.coupon ? ` Use o cupom ${offer.coupon}.` : '';
    return {
      headline: headline.slice(0, 140),
      description: `Preço promocional por tempo limitado.${coupon}`.slice(0, 500),
      source: 'template',
    };
  }

  async generate(offer: CopyOffer, mode: 'template' | 'ai'): Promise<GeneratedCopyDto> {
    const fallback = this.template(offer);
    if (mode === 'template') return fallback;

    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const model = this.config.get<string>('OPENAI_MODEL');
    if (!apiKey || !model) return fallback;

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content:
                'Você escreve ofertas em português do Brasil. Use somente fatos fornecidos. Retorne JSON com headline (máximo 140 caracteres) e description (máximo 500). Não invente benefícios, urgência ou desconto.',
            },
            { role: 'user', content: JSON.stringify(offer) },
          ],
          max_output_tokens: 250,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return fallback;

      const payload = (await response.json()) as OpenAiResponse;
      const outputText =
        payload.output_text ??
        payload.output
          ?.flatMap((item) => item.content ?? [])
          .find((content) => content.type === 'output_text')?.text;
      const raw = outputText?.replace(/^```json\s*|\s*```$/g, '').trim();
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as { headline?: unknown; description?: unknown };
      if (typeof parsed.headline !== 'string' || typeof parsed.description !== 'string') {
        return fallback;
      }

      const headline = parsed.headline.trim().slice(0, 140);
      const description = parsed.description.trim().slice(0, 500);
      if (!headline || !description) return fallback;
      return { headline, description, source: 'openai' };
    } catch {
      return fallback;
    }
  }
}

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

export function discountPercent(current: number, original: number | null): number | null {
  if (!original || original <= current) return null;
  return Math.round((1 - current / original) * 100);
}
