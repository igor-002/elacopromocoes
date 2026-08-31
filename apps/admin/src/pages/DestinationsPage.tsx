import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDestinationInput, DestinationChannel, DestinationDto } from '@radar/contracts';
import { CheckCircle2, MessageCircle, Plus, RadioTower, Send, Trash2, Wifi } from 'lucide-react';
import { EmptyState, ErrorState, InlineNotice, LoadingRows } from '../components/Feedback';
import { PageHeader } from '../components/PageHeader';
import { api, errorMessage } from '../lib/api';
import { channelLabels, formatDate } from '../lib/format';

export function DestinationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [channel, setChannel] = useState<DestinationChannel>('TELEGRAM');
  const [name, setName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const destinations = useQuery({ queryKey: ['destinations'], queryFn: () => api.get<DestinationDto[]>('/destinations') });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['destinations'] });
  const create = useMutation({
    mutationFn: (input: CreateDestinationInput) => api.post<DestinationDto>('/destinations', input),
    onSuccess: (created) => { void invalidate(); setShowForm(false); setName(''); setExternalId(''); setNotice(`${created.name} foi adicionado aos destinos.`); },
  });
  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.patch<DestinationDto>(`/destinations/${id}`, { enabled }),
    onSuccess: () => void invalidate(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/destinations/${id}`),
    onSuccess: () => { void invalidate(); setNotice('Destino removido.'); },
  });
  const test = useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean; message?: string }>(`/destinations/${id}/test`),
    onSuccess: (result) => setNotice(result.message ?? 'Mensagem de teste enviada.'),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ channel, name, externalId, enabled: true });
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Canais de saída" title="Destinos" description="Defina os grupos e canais que podem receber publicações." action={<button className="button primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} />{showForm ? 'Fechar cadastro' : 'Novo destino'}</button>} />
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {(create.isError || toggle.isError || remove.isError || test.isError) && <InlineNotice tone="danger">{errorMessage(create.error ?? toggle.error ?? remove.error ?? test.error)}</InlineNotice>}

      {showForm && <form className="panel destination-form" onSubmit={submit}>
        <div className="panel-header"><div><p className="eyebrow">Novo ponto de entrega</p><h2>Conectar destino</h2></div></div>
        <div className="channel-choice" role="group" aria-label="Canal">
          <button type="button" className={channel === 'TELEGRAM' ? 'selected' : ''} onClick={() => setChannel('TELEGRAM')} aria-pressed={channel === 'TELEGRAM'}><Send size={21} /><span><strong>Telegram</strong><small>Bot API oficial</small></span>{channel === 'TELEGRAM' && <CheckCircle2 size={18} />}</button>
          <button type="button" className={channel === 'WHATSAPP' ? 'selected' : ''} onClick={() => setChannel('WHATSAPP')} aria-pressed={channel === 'WHATSAPP'}><MessageCircle size={21} /><span><strong>WhatsApp</strong><small>Evolution API</small></span>{channel === 'WHATSAPP' && <CheckCircle2 size={18} />}</button>
        </div>
        <div className="field-grid">
          <label className="field"><span>Nome para identificar</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} placeholder="Ex.: Ofertas de tecnologia" required /></label>
          <label className="field"><span>ID externo <small>{channel === 'TELEGRAM' ? 'Ex.: -100123…' : 'ID do grupo'}</small></span><input value={externalId} onChange={(event) => setExternalId(event.target.value)} minLength={2} maxLength={160} required /></label>
        </div>
        <div className="form-actions"><button type="button" className="button ghost" onClick={() => setShowForm(false)}>Cancelar</button><button className="button primary" type="submit" disabled={create.isPending}>{create.isPending ? 'Adicionando…' : 'Adicionar destino'}</button></div>
      </form>}

      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">Conexões</p><h2>Destinos cadastrados</h2></div><span className="connection-summary"><Wifi size={17} />{destinations.data?.filter((item) => item.enabled).length ?? 0} ativos</span></div>
        {destinations.isPending ? <LoadingRows /> : destinations.isError ? <ErrorState message={errorMessage(destinations.error)} onRetry={() => void destinations.refetch()} /> : destinations.data.length === 0 ? <EmptyState title="Nenhum destino conectado" description="Cadastre um grupo ou canal para liberar a publicação de ofertas." action={<button className="button primary" onClick={() => setShowForm(true)}>Conectar destino</button>} /> : (
          <div className="destination-list">
            {destinations.data.map((destination) => <article className="destination-row" key={destination.id}>
              <span className={`channel-icon ${destination.channel.toLowerCase()}`}>{destination.channel === 'TELEGRAM' ? <Send /> : <MessageCircle />}</span>
              <div className="destination-identity"><strong>{destination.name}</strong><span>{channelLabels[destination.channel]} · <code>{destination.externalId}</code></span></div>
              <div className="destination-date"><span>Adicionado em</span><time>{formatDate(destination.createdAt)}</time></div>
              <label className="switch"><input type="checkbox" checked={destination.enabled} onChange={(event) => toggle.mutate({ id: destination.id, enabled: event.target.checked })} /><span /><em>{destination.enabled ? 'Ativo' : 'Pausado'}</em></label>
              <div className="row-buttons"><button className="button ghost compact" onClick={() => test.mutate(destination.id)} disabled={!destination.enabled || test.isPending}>Testar</button><button className="icon-button danger" aria-label={`Remover ${destination.name}`} onClick={() => { if (window.confirm(`Remover o destino “${destination.name}”?`)) remove.mutate(destination.id); }}><Trash2 size={17} /></button></div>
            </article>)}
          </div>
        )}
      </section>
      <aside className="operational-note"><RadioTower size={20} /><div><strong>Antes de publicar no WhatsApp</strong><p>Confirme que a instância da Evolution API está conectada e que o grupo consentiu em receber ofertas.</p></div></aside>
    </div>
  );
}
