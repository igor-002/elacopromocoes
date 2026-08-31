import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OfferDto } from '@radar/contracts';
import { PackageSearch } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { InlineNotice } from './Feedback';

interface AmazonImportResult {
  created: OfferDto[];
  skipped: number;
}

export function amazonImportSummary(created: number, skipped: number) {
  if (created === 0 && skipped === 0) return 'A Amazon não retornou produtos válidos para essa busca.';
  const imported = `${created} ${created === 1 ? 'oferta importada' : 'ofertas importadas'}.`;
  if (skipped === 0) return imported;
  return `${imported} ${skipped} ${skipped === 1 ? 'item já estava' : 'itens já estavam'} no catálogo e ${skipped === 1 ? 'foi ignorado' : 'foram ignorados'}.`;
}

export function AmazonImportForm() {
  const [keyword, setKeyword] = useState('');
  const [itemCount, setItemCount] = useState(5);
  const [result, setResult] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const amazonImport = useMutation({
    mutationFn: () => api.post<AmazonImportResult>('/offers/import/amazon', {
      keyword: keyword.trim(),
      itemCount,
    }),
    onMutate: () => setResult(null),
    onSuccess: (data) => {
      setResult(amazonImportSummary(data.created.length, data.skipped));
      void queryClient.invalidateQueries({ queryKey: ['offers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (keyword.trim().length < 2) return;
    amazonImport.mutate();
  }

  return (
    <section className="amazon-import" aria-labelledby="amazon-import-title">
      <div className="amazon-import-heading">
        <span className="amazon-import-icon"><PackageSearch aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Amazon Creators API</p>
          <h2 id="amazon-import-title">Buscar e importar</h2>
          <p>Os produtos entram como rascunho para revisão.</p>
        </div>
      </div>
      <form className="amazon-import-controls" onSubmit={submit}>
        <label className="field amazon-keyword">
          <span>Palavra-chave</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} minLength={2} maxLength={120} placeholder="Ex.: cafeteira elétrica" required />
        </label>
        <label className="field amazon-count">
          <span>Quantidade</span>
          <input type="number" value={itemCount} onChange={(event) => setItemCount(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} min={1} max={10} required />
        </label>
        <button className="button secondary" type="submit" disabled={amazonImport.isPending || keyword.trim().length < 2}>
          <PackageSearch size={18} />{amazonImport.isPending ? 'Consultando…' : 'Importar da Amazon'}
        </button>
      </form>
      {result && <InlineNotice>{result}</InlineNotice>}
      {amazonImport.isError && <InlineNotice tone="danger">{errorMessage(amazonImport.error)}</InlineNotice>}
    </section>
  );
}
