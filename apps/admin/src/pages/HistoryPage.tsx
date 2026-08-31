import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicationDto, PublicationStatus } from '@radar/contracts';
import { Ban, CalendarDays, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, InlineNotice, LoadingRows } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { PublicationStatusBadge } from '../components/Status';
import { api, errorMessage } from '../lib/api';
import { channelLabels, formatDate, marketplaceLabels } from '../lib/format';

export function HistoryPage() {
  const [status, setStatus] = useState<PublicationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const publications = useQuery({ queryKey: ['publications'], queryFn: () => api.get<PublicationDto[]>('/publications') });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['publications'] });
  const retry = useMutation({ mutationFn: (id: string) => api.post<PublicationDto>(`/publications/${id}/retry`), onSuccess: () => { void invalidate(); setNotice('Publicação recolocada na fila.'); } });
  const cancel = useMutation({ mutationFn: (id: string) => api.post<PublicationDto>(`/publications/${id}/cancel`), onSuccess: () => { void invalidate(); setNotice('Agendamento cancelado.'); } });
  const filtered = useMemo(() => (publications.data ?? []).filter((item) => {
    const text = `${item.offer?.title ?? ''} ${item.destination?.name ?? ''}`.toLowerCase();
    return (status === 'ALL' || item.status === status) && text.includes(search.toLowerCase());
  }), [publications.data, search, status]);

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Rastro operacional" title="Histórico" description="Confira cada tentativa de entrega e resolva o que exige atenção." />
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {(retry.isError || cancel.isError) && <InlineNotice tone="danger">{errorMessage(retry.error ?? cancel.error)}</InlineNotice>}
      <section className="filter-bar" aria-label="Filtros do histórico">
        <label className="search-field"><span className="sr-only">Buscar no histórico</span><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar oferta ou destino" /></label>
        <label className="filter-select"><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="ALL">Todos os status</option><option value="SCHEDULED">Agendadas</option><option value="SENDING">Enviando</option><option value="SENT">Enviadas</option><option value="FAILED">Falhas</option><option value="UNKNOWN">A confirmar</option><option value="CANCELLED">Canceladas</option></select></label>
      </section>
      <section className="panel history-panel">
        <div className="list-caption"><span>{filtered.length} registros</span><span>Uma linha por destino</span></div>
        {publications.isPending ? <LoadingRows count={6} /> : publications.isError ? <ErrorState message={errorMessage(publications.error)} onRetry={() => void publications.refetch()} /> : filtered.length === 0 ? <EmptyState title={publications.data.length ? 'Nada neste recorte' : 'Nenhuma publicação registrada'} description={publications.data.length ? 'Altere os filtros para encontrar outro registro.' : 'Quando uma oferta for publicada, cada destino aparecerá aqui.'} /> : (
          <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Oferta</th><th>Destino</th><th>Programada para</th><th>Status</th><th>Tentativas</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filtered.map((publication) => <tr key={publication.id}>
            <td><Link to={`/ofertas/${publication.offerId}`}><span className="market-token">{publication.offer?.marketplace === 'MERCADO_LIVRE' ? 'ML' : 'AMZ'}</span><span><strong>{publication.offer?.title ?? 'Oferta removida'}</strong><small>{publication.offer ? marketplaceLabels[publication.offer.marketplace] : 'Indisponível'}</small></span></Link></td>
            <td><strong>{publication.destination?.name ?? 'Destino removido'}</strong><small>{publication.destination ? channelLabels[publication.destination.channel] : 'Indisponível'}</small></td>
            <td><time>{formatDate(publication.scheduledAt)}</time></td><td><PublicationStatusBadge status={publication.status} />{publication.error && <small className="error-detail" title={publication.error}>{publication.error}</small>}</td><td><span className="attempt-count">{publication.attempts}/3</span></td>
            <td><div className="row-buttons">{publication.status === 'FAILED' && <button className="icon-button" aria-label="Tentar novamente" title="Tentar novamente" onClick={() => retry.mutate(publication.id)}><RefreshCw size={17} /></button>}{publication.status === 'SCHEDULED' && <button className="icon-button danger" aria-label="Cancelar agendamento" title="Cancelar agendamento" onClick={() => cancel.mutate(publication.id)}><Ban size={17} /></button>}</div></td>
          </tr>)}</tbody></table></div>
        )}
      </section>
      <aside className="operational-note"><CalendarDays size={20} /><div><strong>Estado “A confirmar”</strong><p>Indica que o canal pode ter recebido a mensagem, mas não confirmou a entrega. O sistema não repete automaticamente para evitar duplicidade.</p></div></aside>
    </div>
  );
}
