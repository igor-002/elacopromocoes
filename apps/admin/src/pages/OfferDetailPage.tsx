import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DestinationDto, GeneratedCopyDto, OfferDto, PublicationDto } from '@radar/contracts';
import { ArrowLeft, Bot, CalendarClock, CheckCircle2, Edit3, ExternalLink, Send, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, FullPageLoading, InlineNotice } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { OfferStateRail, OfferStatusBadge } from '../components/Status';
import { api, errorMessage } from '../lib/api';
import { channelLabels, discountPercentage, formatMoney, marketplaceLabels } from '../lib/format';

export function OfferDetailPage() {
  const { offerId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const offer = useQuery({ queryKey: ['offer', offerId], queryFn: () => api.get<OfferDto>(`/offers/${offerId}`) });
  const destinations = useQuery({ queryKey: ['destinations'], queryFn: () => api.get<DestinationDto[]>('/destinations') });

  const copy = useMutation({
    mutationFn: (mode: 'template' | 'ai') => api.post<GeneratedCopyDto>(`/offers/${offerId}/copy`, { mode }),
    onSuccess: (data) => {
      queryClient.setQueryData<OfferDto>(['offer', offerId], (current) => current ? { ...current, headline: data.headline, description: data.description, status: 'DRAFT' } : current);
      void queryClient.invalidateQueries({ queryKey: ['offers'] });
      setFeedback(data.source === 'openai' ? 'Copy criada com IA. Revise antes de aprovar.' : 'Copy criada pelo template. Revise antes de aprovar.');
    },
  });
  const approve = useMutation({
    mutationFn: () => api.post<OfferDto>(`/offers/${offerId}/approve`),
    onSuccess: (data) => { queryClient.setQueryData(['offer', offerId], data); void queryClient.invalidateQueries({ queryKey: ['offers'] }); setFeedback('Oferta aprovada e pronta para publicação.'); },
  });
  const publish = useMutation({
    mutationFn: () => api.post<PublicationDto[]>('/publications', {
      offerId,
      destinationIds: selectedDestinations,
      ...(scheduleMode === 'later' && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); void queryClient.invalidateQueries({ queryKey: ['publications'] }); setFeedback(scheduleMode === 'later' ? 'Publicação agendada.' : 'Oferta enviada para a fila de publicação.'); },
  });
  const archive = useMutation({
    mutationFn: () => api.post<OfferDto>(`/offers/${offerId}/archive`),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['offers'] }); navigate('/ofertas'); },
  });

  const enabledDestinations = useMemo(() => (destinations.data ?? []).filter((item) => item.enabled), [destinations.data]);
  if (offer.isPending) return <FullPageLoading label="Abrindo oferta" />;
  if (offer.isError) return <ErrorState message={errorMessage(offer.error)} onRetry={() => void offer.refetch()} />;
  const discount = discountPercentage(offer.data.currentPriceCents, offer.data.originalPriceCents);

  return (
    <div className="page-stack">
      <PageHeader eyebrow={`${marketplaceLabels[offer.data.marketplace]} · ${offer.data.productId ?? 'Sem ID externo'}`} title={offer.data.title} action={<div className="action-group"><Link className="button ghost" to="/ofertas"><ArrowLeft size={18} />Ofertas</Link><Link className="button secondary" to={`/ofertas/${offerId}/editar`}><Edit3 size={17} />Editar</Link></div>} />
      <OfferStateRail step={offer.data.status === 'APPROVED' ? 1 : 0} />
      {feedback && <InlineNotice>{feedback}</InlineNotice>}
      {(copy.isError || approve.isError || publish.isError) && <InlineNotice tone="danger">{errorMessage(copy.error ?? approve.error ?? publish.error)}</InlineNotice>}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel product-summary">
            <div className="detail-image">{offer.data.imageUrl ? <img src={offer.data.imageUrl} alt="" /> : <span>{offer.data.marketplace === 'AMAZON' ? 'AMZ' : 'ML'}</span>}</div>
            <div>
              <div className="offer-topline"><span className="marketplace-label">{marketplaceLabels[offer.data.marketplace]}</span><OfferStatusBadge status={offer.data.status} /></div>
              <div className="detail-price"><strong>{formatMoney(offer.data.currentPriceCents)}</strong>{offer.data.originalPriceCents && <del>{formatMoney(offer.data.originalPriceCents)}</del>}{discount && <span className="discount-tag">−{discount}%</span>}</div>
              {offer.data.coupon && <p className="coupon-line">Cupom <code>{offer.data.coupon}</code></p>}
              <a className="text-link" href={offer.data.affiliateUrl} target="_blank" rel="noreferrer">Abrir produto <ExternalLink size={15} /></a>
            </div>
          </section>

          <section className="panel copy-workbench">
            <div className="panel-header"><div><p className="eyebrow">Mensagem</p><h2>Copy da publicação</h2></div><div className="action-group"><button className="button ghost" onClick={() => copy.mutate('template')} disabled={copy.isPending}><Sparkles size={17} />Usar template</button><button className="button secondary" onClick={() => copy.mutate('ai')} disabled={copy.isPending}><Bot size={17} />{copy.isPending ? 'Gerando…' : 'Gerar com IA'}</button></div></div>
            <div className="message-preview">
              {offer.data.headline || offer.data.description ? <><h3>🔥 {offer.data.headline || offer.data.title}</h3><p>{offer.data.description}</p><div className="message-prices">{offer.data.originalPriceCents && <span>De: {formatMoney(offer.data.originalPriceCents)}</span>}<strong>Por: {formatMoney(offer.data.currentPriceCents)}</strong></div>{offer.data.coupon && <p>🏷 Cupom: {offer.data.coupon}</p>}<span className="fake-link">🛒 {offer.data.affiliateUrl}</span><small>#pub</small></> : <div className="compact-empty"><p>A mensagem ainda não foi preparada.</p><button className="text-link" onClick={() => copy.mutate('template')}>Gerar pelo template</button></div>}
            </div>
            {offer.data.status === 'DRAFT' && <div className="approval-row"><div><strong>Revisou preço, link e mensagem?</strong><span>A aprovação libera os controles de publicação.</span></div><button className="button success" onClick={() => approve.mutate()} disabled={approve.isPending || !offer.data.headline || !offer.data.description}><CheckCircle2 size={18} />{approve.isPending ? 'Aprovando…' : 'Aprovar oferta'}</button></div>}
          </section>
        </div>

        <aside className="panel publish-box">
          <p className="eyebrow">Distribuição</p><h2>Onde esta oferta vai sair?</h2>
          {offer.data.status !== 'APPROVED' ? <div className="locked-state"><CheckCircle2 size={24} /><strong>Aprove para continuar</strong><p>Assim, nenhuma oferta incompleta chega aos canais.</p></div> : destinations.isError ? <ErrorState message={errorMessage(destinations.error)} /> : enabledDestinations.length === 0 ? <div className="compact-empty"><p>Não há destinos ativos.</p><Link className="text-link" to="/destinos">Configurar destinos</Link></div> : (
            <>
              <fieldset className="destination-picker"><legend>Destinos</legend>{enabledDestinations.map((destination) => <label key={destination.id} className="check-card"><input type="checkbox" checked={selectedDestinations.includes(destination.id)} onChange={(event) => setSelectedDestinations((current) => event.target.checked ? [...current, destination.id] : current.filter((id) => id !== destination.id))} /><span className="check-visual" /><span><strong>{destination.name}</strong><small>{channelLabels[destination.channel]}</small></span></label>)}</fieldset>
              <fieldset className="schedule-picker"><legend>Quando publicar</legend><label><input type="radio" name="schedule" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} />Agora</label><label><input type="radio" name="schedule" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} />Agendar</label></fieldset>
              {scheduleMode === 'later' && <label className="field"><span>Data e horário</span><input type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setScheduledAt(event.target.value)} required /></label>}
              <button className="button primary wide" onClick={() => publish.mutate()} disabled={publish.isPending || selectedDestinations.length === 0 || (scheduleMode === 'later' && !scheduledAt)}>{scheduleMode === 'later' ? <CalendarClock size={18} /> : <Send size={18} />}{publish.isPending ? 'Colocando na fila…' : scheduleMode === 'later' ? 'Agendar publicação' : 'Publicar agora'}</button>
              <p className="save-hint">Será criada uma publicação independente para cada destino.</p>
            </>
          )}
          <div className="danger-zone"><span>Não quer mais usar esta oferta?</span><button className="text-button danger" onClick={() => archive.mutate()} disabled={archive.isPending}>Arquivar oferta</button></div>
        </aside>
      </div>
    </div>
  );
}
