import type { OfferStatus, PublicationStatus } from '@radar/contracts';
import { offerStatusLabels, publicationStatusLabels } from '../lib/format';

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><span aria-hidden="true" />{offerStatusLabels[status]}</span>;
}

export function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><span aria-hidden="true" />{publicationStatusLabels[status]}</span>;
}

const railStates = ['Rascunho', 'Aprovada', 'Agendada', 'Enviada'];

export function OfferStateRail({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="state-rail" aria-label={`Etapa atual: ${railStates[step]}`}>
      {railStates.map((label, index) => (
        <li key={label} className={index < step ? 'complete' : index === step ? 'current' : ''}>
          <span className="rail-dot" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
