import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfferStateRail, PublicationStatusBadge } from './Status';

describe('status operacionais', () => {
  it('expõe o status por texto e não apenas por cor', () => {
    render(<PublicationStatusBadge status="UNKNOWN" />);
    expect(screen.getByText('A confirmar')).toBeVisible();
  });

  it('informa a etapa atual do trilho', () => {
    render(<OfferStateRail step={2} />);
    expect(screen.getByRole('list', { name: 'Etapa atual: Agendada' })).toBeVisible();
    expect(screen.getByText('Enviada')).toBeVisible();
  });
});
