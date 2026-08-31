export interface MessageOffer {
  headline: string;
  description: string;
  currentPriceCents: number;
  originalPriceCents: number | null;
  coupon: string | null;
  affiliateUrl: string;
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatPublicationMessage(offer: MessageOffer): string {
  const lines = [`🔥 ${offer.headline}`, '', offer.description, ''];
  if (offer.originalPriceCents && offer.originalPriceCents > offer.currentPriceCents) {
    lines.push(`De: ${currency.format(offer.originalPriceCents / 100)}`);
  }
  lines.push(`Por: ${currency.format(offer.currentPriceCents / 100)}`);
  if (offer.coupon) lines.push(`Cupom: ${offer.coupon}`);
  lines.push('', `🛒 ${offer.affiliateUrl}`, '', '#pub');
  return lines.join('\n');
}
