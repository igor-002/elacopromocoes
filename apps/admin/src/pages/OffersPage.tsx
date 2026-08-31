import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Marketplace, OfferDto, OfferStatus } from '@radar/contracts';
import { ArrowRight, Filter, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AmazonImportForm } from '../components/AmazonImportForm';
import { EmptyState, ErrorState, LoadingRows } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { OfferStateRail, OfferStatusBadge } from '../components/Status';
import { api, errorMessage } from '../lib/api';
import { discountPercentage, formatDate, formatMoney, marketplaceLabels } from '../lib/format';

export function OffersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OfferStatus | 'ALL'>('ALL');
  const [marketplace, setMarketplace] = useState<Marketplace | 'ALL'>('ALL');
  const offers = useQuery({ queryKey: ['offers'], queryFn: () => api.get<OfferDto[]>('/offers') });
  const filtered = useMemo(() => (offers.data ?? []).filter((offer) => {
    const matchesSearch = `${offer.title} ${offer.category ?? ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'ALL' || offer.status === status) && (marketplace === 'ALL' || offer.marketplace === marketplace);
  }), [offers.data, marketplace, search, status]);

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Catálogo editorial" title="Ofertas" description="Prepare cada mensagem antes de colocá-la em circulação." action={<Link className="button primary" to="/ofertas/nova"><Plus size={18} />Nova oferta</Link>} />

      <AmazonImportForm />

      <section className="filter-bar" aria-label="Filtros de ofertas">
        <label className="search-field"><span className="sr-only">Buscar ofertas</span><Search size={18} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título ou categoria" /></label>
        <div className="filter-select"><Filter size={17} aria-hidden="true" /><label><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="ALL">Todos os status</option><option value="DRAFT">Rascunhos</option><option value="APPROVED">Aprovadas</option><option value="ARCHIVED">Arquivadas</option></select></label></div>
        <label className="filter-select"><span className="sr-only">Filtrar por marketplace</span><select value={marketplace} onChange={(event) => setMarketplace(event.target.value as typeof marketplace)}><option value="ALL">Todos os marketplaces</option><option value="AMAZON">Amazon</option><option value="MERCADO_LIVRE">Mercado Livre</option></select></label>
      </section>

      <section className="offers-panel">
        <div className="list-caption"><span>{filtered.length} {filtered.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}</span><span>Atualização automática a cada acesso</span></div>
        {offers.isPending ? <LoadingRows count={5} /> : offers.isError ? <ErrorState message={errorMessage(offers.error)} onRetry={() => void offers.refetch()} /> : filtered.length === 0 ? (
          <EmptyState title={offers.data.length === 0 ? 'Sua primeira oferta começa aqui' : 'Nenhuma oferta neste recorte'} description={offers.data.length === 0 ? 'Cadastre um produto, revise a mensagem e escolha os destinos.' : 'Remova um filtro ou procure por outro termo.'} action={offers.data.length === 0 ? <Link className="button primary" to="/ofertas/nova">Cadastrar oferta</Link> : <button className="button secondary" onClick={() => { setSearch(''); setStatus('ALL'); setMarketplace('ALL'); }}>Limpar filtros</button>} />
        ) : (
          <div className="offer-list">
            {filtered.map((offer) => <OfferRow key={offer.id} offer={offer} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function OfferRow({ offer }: { offer: OfferDto }) {
  const discount = discountPercentage(offer.currentPriceCents, offer.originalPriceCents);
  return (
    <article className="offer-row">
      <div className="product-thumb">{offer.imageUrl ? <img src={offer.imageUrl} alt="" /> : <span>{offer.marketplace === 'AMAZON' ? 'AMZ' : 'ML'}</span>}</div>
      <div className="offer-content">
        <div className="offer-topline"><span className="marketplace-label">{marketplaceLabels[offer.marketplace]}</span><OfferStatusBadge status={offer.status} /></div>
        <h2><Link to={`/ofertas/${offer.id}`}>{offer.title}</Link></h2>
        <div className="price-line"><strong>{formatMoney(offer.currentPriceCents)}</strong>{offer.originalPriceCents && <del>{formatMoney(offer.originalPriceCents)}</del>}{discount && <span className="discount-tag">−{discount}%</span>}</div>
        <span className="updated-at">Atualizada {formatDate(offer.updatedAt)}</span>
      </div>
      <div className="offer-progress"><OfferStateRail step={offer.status === 'DRAFT' ? 0 : offer.status === 'APPROVED' ? 1 : 0} /></div>
      <Link to={`/ofertas/${offer.id}`} className="icon-button row-action" aria-label={`Abrir ${offer.title}`}><ArrowRight size={19} /></Link>
    </article>
  );
}
