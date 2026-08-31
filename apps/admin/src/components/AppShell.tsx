import type { ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, LogOut, Megaphone, RadioTower, ReceiptText, Radar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const links = [
  { to: '/', label: 'Visão geral', icon: BarChart3, end: true },
  { to: '/ofertas', label: 'Ofertas', icon: Megaphone },
  { to: '/destinos', label: 'Destinos', icon: RadioTower },
  { to: '/historico', label: 'Histórico', icon: ReceiptText },
];

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return (
    <div className="app-frame">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Radar de Ofertas — início">
          <span className="brand-mark"><Radar aria-hidden="true" /></span>
          <span><strong>Radar</strong><small>de ofertas</small></span>
        </NavLink>

        <nav className="primary-nav" aria-label="Navegação principal">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={Boolean(end)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="account-block">
          <span className="account-label">Sessão ativa</span>
          <strong title={email}>{email}</strong>
          <button className="text-button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut size={17} aria-hidden="true" />
            {logout.isPending ? 'Saindo…' : 'Sair'}
          </button>
        </div>
      </aside>

      <div className="mobile-topbar">
        <NavLink to="/" className="brand" aria-label="Radar de Ofertas — início">
          <span className="brand-mark"><Radar aria-hidden="true" /></span>
          <strong>Radar</strong>
        </NavLink>
        <button className="icon-button" aria-label="Sair" onClick={() => logout.mutate()}>
          <LogOut size={19} />
        </button>
      </div>
      <nav className="mobile-nav" aria-label="Navegação principal">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={Boolean(end)} className={({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link'}>
            <Icon size={17} aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>

      <main id="conteudo" className="workspace" tabIndex={-1}>{children}</main>
    </div>
  );
}
