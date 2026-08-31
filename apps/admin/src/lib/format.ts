import type { DestinationChannel, Marketplace, OfferStatus, PublicationStatus } from '@radar/contracts';

export const marketplaceLabels: Record<Marketplace, string> = {
  AMAZON: 'Amazon',
  MERCADO_LIVRE: 'Mercado Livre',
};

export const channelLabels: Record<DestinationChannel, string> = {
  TELEGRAM: 'Telegram',
  WHATSAPP: 'WhatsApp',
};

export const offerStatusLabels: Record<OfferStatus, string> = {
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovada',
  ARCHIVED: 'Arquivada',
};

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  SCHEDULED: 'Agendada',
  SENDING: 'Enviando',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  UNKNOWN: 'A confirmar',
  CANCELLED: 'Cancelada',
};

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function toCents(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export function fromCents(value: number | null | undefined) {
  if (value == null) return '';
  return (value / 100).toFixed(2).replace('.', ',');
}

export function discountPercentage(current: number, original: number | null) {
  if (!original || original <= current) return null;
  return Math.round((1 - current / original) * 100);
}
