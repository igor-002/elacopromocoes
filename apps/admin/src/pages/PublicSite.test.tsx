import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { isPublicHostname } from '../App';
import { PublicSite } from './PublicSite';

describe('PublicSite', () => {
  it('apresenta a proposta e a divulgação de afiliado na página inicial', () => {
    render(
      <MemoryRouter>
        <PublicSite />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /oferta boa não precisa/i })).toBeInTheDocument();
    expect(screen.getAllByText(/como associado da amazon/i).length).toBeGreaterThan(0);
    const adminLinks = screen.getAllByRole('link', { name: /área administrativa/i });
    expect(adminLinks).toHaveLength(2);
    adminLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://admin.elaco.com.br/login');
    });
  });

  it('expõe a política de privacidade em rota pública', () => {
    render(
      <MemoryRouter initialEntries={['/privacidade']}>
        <PublicSite />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText(/não possui cadastro, newsletter ou formulário/i)).toBeInTheDocument();
  });
});

describe('isPublicHostname', () => {
  it('separa o site público do painel administrativo', () => {
    expect(isPublicHostname('elaco.com.br')).toBe(true);
    expect(isPublicHostname('WWW.ELACO.COM.BR')).toBe(true);
    expect(isPublicHostname('admin.elaco.com.br')).toBe(false);
    expect(isPublicHostname('localhost')).toBe(false);
  });
});
