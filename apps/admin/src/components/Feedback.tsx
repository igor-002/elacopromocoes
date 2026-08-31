import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function FullPageLoading({ label }: { label: string }) {
  return <main className="full-page-loading"><LoaderCircle className="spin" aria-hidden="true" /><span>{label}</span></main>;
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="loading-rows" aria-label="Carregando" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => <div className="skeleton-row" key={index} />)}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Inbox aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div><strong>Algo saiu do fluxo</strong><p>{message}</p></div>
      {onRetry && <button className="button secondary" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

export function InlineNotice({ tone = 'success', children }: { tone?: 'success' | 'danger' | 'info'; children: ReactNode }) {
  return <div className={`inline-notice ${tone}`} role="status" aria-live="polite">{children}</div>;
}
