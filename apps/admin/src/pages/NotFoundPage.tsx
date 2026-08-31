import { ArrowLeft, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="not-found"><Radar size={42} /><p className="eyebrow">Erro 404</p><h1>Esta rota saiu do radar.</h1><p>Volte à central para continuar acompanhando suas ofertas.</p><Link className="button primary" to="/"><ArrowLeft size={18} />Ir para a visão geral</Link></main>;
}
