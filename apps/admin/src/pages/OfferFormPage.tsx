import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, Image, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createOfferSchema, type CreateOfferInput, type Marketplace, type OfferDto } from '@radar/contracts';
import { ErrorState, FullPageLoading } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { api, errorMessage } from '../lib/api';
import { fromCents, marketplaceLabels, toCents } from '../lib/format';

type FormState = {
  marketplace: Marketplace;
  productId: string;
  title: string;
  affiliateUrl: string;
  imageUrl: string;
  currentPrice: string;
  originalPrice: string;
  coupon: string;
  category: string;
  headline: string;
  description: string;
};

const emptyForm: FormState = {
  marketplace: 'AMAZON', productId: '', title: '', affiliateUrl: '', imageUrl: '', currentPrice: '', originalPrice: '', coupon: '', category: '', headline: '', description: '',
};

export function OfferFormPage() {
  const { offerId } = useParams();
  const editing = Boolean(offerId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const offer = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => api.get<OfferDto>(`/offers/${offerId}`),
    enabled: editing,
  });

  useEffect(() => {
    if (!offer.data) return;
    setForm({
      marketplace: offer.data.marketplace,
      productId: offer.data.productId ?? '',
      title: offer.data.title,
      affiliateUrl: offer.data.affiliateUrl,
      imageUrl: offer.data.imageUrl ?? '',
      currentPrice: fromCents(offer.data.currentPriceCents),
      originalPrice: fromCents(offer.data.originalPriceCents),
      coupon: offer.data.coupon ?? '',
      category: offer.data.category ?? '',
      headline: offer.data.headline,
      description: offer.data.description,
    });
  }, [offer.data]);

  const save = useMutation({
    mutationFn: (input: CreateOfferInput) => editing ? api.patch<OfferDto>(`/offers/${offerId}`, input) : api.post<OfferDto>('/offers', input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['offers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.setQueryData(['offer', saved.id], saved);
      navigate(`/ofertas/${saved.id}`, { replace: true });
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const candidate = {
      marketplace: form.marketplace,
      productId: form.productId,
      title: form.title,
      affiliateUrl: form.affiliateUrl,
      imageUrl: form.imageUrl,
      currentPriceCents: toCents(form.currentPrice),
      ...(form.originalPrice ? { originalPriceCents: toCents(form.originalPrice) } : {}),
      coupon: form.coupon,
      category: form.category,
      headline: form.headline,
      description: form.description,
    };
    const parsed = createOfferSchema.safeParse(candidate);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    save.mutate(parsed.data);
  }

  if (editing && offer.isPending) return <FullPageLoading label="Carregando oferta" />;
  if (editing && offer.isError) return <ErrorState message={errorMessage(offer.error)} onRetry={() => void offer.refetch()} />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow={editing ? 'Editar oferta' : 'Nova oferta'} title={editing ? 'Ajuste os dados do produto' : 'Prepare uma oferta para revisão'} description="Os campos marcados são necessários para montar uma publicação confiável." action={<Link className="button ghost" to={editing ? `/ofertas/${offerId}` : '/ofertas'}><ArrowLeft size={18} />Voltar</Link>} />

      <form className="editor-layout" onSubmit={submit} noValidate>
        <div className="form-sections">
          {save.isError && <div className="field-error" role="alert">{errorMessage(save.error)}</div>}
          <section className="form-card">
            <div className="section-heading"><span>01</span><div><h2>Origem do produto</h2><p>Identifique de onde vem a oferta e preserve o link comissionado.</p></div></div>
            <div className="segmented-control" role="group" aria-label="Marketplace">
              {(['AMAZON', 'MERCADO_LIVRE'] as Marketplace[]).map((market) => <button key={market} type="button" className={form.marketplace === market ? 'selected' : ''} aria-pressed={form.marketplace === market} onClick={() => update('marketplace', market)}><span>{market === 'AMAZON' ? 'AMZ' : 'ML'}</span>{marketplaceLabels[market]}{form.marketplace === market && <Check size={17} />}</button>)}
            </div>
            <div className="field-grid">
              <Field label="Link de afiliado" error={fieldErrors.affiliateUrl} wide><div className="input-with-icon"><input type="url" value={form.affiliateUrl} onChange={(event) => update('affiliateUrl', event.target.value)} placeholder={form.marketplace === 'AMAZON' ? 'https://amazon.com.br/…' : 'https://mercadolivre.com.br/…'} required /><ExternalLink size={17} /></div></Field>
              <Field label="ID do produto" hint="Opcional — ASIN ou ID MLB" error={fieldErrors.productId}><input value={form.productId} onChange={(event) => update('productId', event.target.value)} /></Field>
              <Field label="Categoria" hint="Opcional" error={fieldErrors.category}><input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Ex.: Livros" /></Field>
            </div>
          </section>

          <section className="form-card">
            <div className="section-heading"><span>02</span><div><h2>Dados da oferta</h2><p>Use exatamente o que o comprador encontrará ao abrir o link.</p></div></div>
            <div className="field-grid">
              <Field label="Título do produto" error={fieldErrors.title} wide><input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={180} required /></Field>
              <Field label="Preço atual" hint="Em reais" error={fieldErrors.currentPriceCents}><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.currentPrice} onChange={(event) => update('currentPrice', event.target.value)} placeholder="0,00" required /></div></Field>
              <Field label="Preço anterior" hint="Opcional" error={fieldErrors.originalPriceCents}><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.originalPrice} onChange={(event) => update('originalPrice', event.target.value)} placeholder="0,00" /></div></Field>
              <Field label="Cupom" hint="Opcional" error={fieldErrors.coupon}><input value={form.coupon} onChange={(event) => update('coupon', event.target.value)} placeholder="Ex.: LEVE10" /></Field>
              <Field label="URL da imagem" hint="Opcional" error={fieldErrors.imageUrl} wide><input type="url" value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="https://…" /></Field>
            </div>
          </section>

          <section className="form-card">
            <div className="section-heading"><span>03</span><div><h2>Mensagem inicial</h2><p>Você poderá gerar ou revisar a copy na próxima etapa.</p></div></div>
            <div className="field-grid one-column">
              <Field label="Headline" hint={`${form.headline.length}/140`} error={fieldErrors.headline}><input value={form.headline} onChange={(event) => update('headline', event.target.value)} maxLength={140} placeholder="O benefício mais importante em uma frase" /></Field>
              <Field label="Descrição" hint={`${form.description.length}/500`} error={fieldErrors.description}><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} maxLength={500} placeholder="Explique por que esta oferta vale atenção." /></Field>
            </div>
          </section>
        </div>

        <aside className="form-preview">
          <div className="preview-card">
            <div className="preview-label"><Image size={17} />Prévia do produto</div>
            <div className="preview-image">{form.imageUrl ? <img src={form.imageUrl} alt="Prévia informada para o produto" /> : <><Image size={30} /><span>A imagem aparece aqui</span></>}</div>
            <span className="marketplace-label">{marketplaceLabels[form.marketplace]}</span>
            <h3>{form.title || 'Título do produto'}</h3>
            <strong className="preview-price">{form.currentPrice ? `R$ ${form.currentPrice}` : 'R$ 0,00'}</strong>
            <p>{form.headline || 'A headline será revisada antes da publicação.'}</p>
          </div>
          <button className="button primary wide" type="submit" disabled={save.isPending}><Save size={18} />{save.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar como rascunho'}</button>
          <p className="save-hint">Salvar não publica a oferta. A aprovação acontece na próxima etapa.</p>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, hint, error, wide, children }: { label: string; hint?: string | undefined; error?: string | undefined; wide?: boolean | undefined; children: ReactNode }) {
  return <label className={`field ${wide ? 'wide-field' : ''}`}><span className="field-label"><span>{label}</span>{hint && <small>{hint}</small>}</span>{children}{error && <small className="input-error">{error}</small>}</label>;
}
