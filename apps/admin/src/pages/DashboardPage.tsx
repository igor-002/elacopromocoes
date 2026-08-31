import { useQuery } from '@tanstack/react-query';
import type { DashboardDto } from '@radar/contracts';
import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FilePenLine, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingRows } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { PublicationStatusBadge } from '../components/Status';
import { api, errorMessage } from '../lib/api';
import { channelLabels, formatDate } from '../lib/format';

export function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<DashboardDto>('/dashboard') });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Central operacional"
        title="O que precisa andar hoje"
        description="Acompanhe a fila editorial e a entrega nos seus canais."
        action={<Link className="button primary" to="/ofertas/nova"><Plus size={18} />Nova oferta</Link>}
      />

      {dashboard.isError ? <ErrorState message={errorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} /> : (
        <>
          <section className="operation-strip" aria-label="Resumo operacional">
            {dashboard.isPending ? Array.from({ length: 5 }).map((_, index) => <div className="metric skeleton" key={index} />) : (
              <>
                <Metric icon={<FilePenLine />} label="Rascunhos" value={dashboard.data.draftOffers} tone="blue" />
                <Metric icon={<CheckCircle2 />} label="Aprovadas" value={dashboard.data.approvedOffers} tone="green" />
                <Metric icon={<Clock3 />} label="Agendadas" value={dashboard.data.scheduledPublications} tone="orange" />
                <Metric icon={<ArrowRight />} label="Enviadas hoje" value={dashboard.data.sentToday} tone="ink" />
                <Metric icon={<AlertCircle />} label="Com falha" value={dashboard.data.failedPublications} tone={dashboard.data.failedPublications ? 'red' : 'muted'} />
              </>
            )}
          </section>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-header"><div><p className="eyebrow">Últimos movimentos</p><h2>Fila de publicações</h2></div><Link to="/historico" className="text-link">Ver histórico <ArrowRight size={16} /></Link></div>
              {dashboard.isPending ? <LoadingRows /> : dashboard.data.recentPublications.length === 0 ? (
                <div className="compact-empty"><p>Nenhuma publicação passou por aqui ainda.</p><Link to="/ofertas" className="text-link">Escolher uma oferta</Link></div>
              ) : (
                <div className="activity-list">
                  {dashboard.data.recentPublications.map((publication) => (
                    <article className="activity-item" key={publication.id}>
                      <div className="activity-main">
                        <span className="market-token">{publication.offer?.marketplace === 'MERCADO_LIVRE' ? 'ML' : 'AMZ'}</span>
                        <div><strong>{publication.offer?.title ?? 'Oferta removida'}</strong><span>{publication.destination ? `${channelLabels[publication.destination.channel]} · ${publication.destination.name}` : 'Destino indisponível'}</span></div>
                      </div>
                      <div className="activity-meta"><PublicationStatusBadge status={publication.status} /><time>{formatDate(publication.scheduledAt)}</time></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="panel dispatch-panel">
              <p className="eyebrow">Ritmo sugerido</p>
              <h2>Um fluxo simples vence a pressa.</h2>
              <ol>
                <li><span>01</span><div><strong>Cadastre</strong><small>Confira preço, imagem e link.</small></div></li>
                <li><span>02</span><div><strong>Revise</strong><small>Ajuste a copy e aprove.</small></div></li>
                <li><span>03</span><div><strong>Distribua</strong><small>Escolha quando e onde publicar.</small></div></li>
              </ol>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return <div className={`metric ${tone}`}><span className="metric-icon">{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>;
}
