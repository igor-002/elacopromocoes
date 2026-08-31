import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { SessionDto } from '@radar/contracts';
import { AppShell } from './components/AppShell';
import { FullPageLoading } from './components/Feedback';
import { api, ApiError } from './lib/api';
import { DashboardPage } from './pages/DashboardPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { OfferFormPage } from './pages/OfferFormPage';
import { OffersPage } from './pages/OffersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PublicSite } from './pages/PublicSite';

const publicHosts = new Set(['elaco.com.br', 'www.elaco.com.br']);

export function isPublicHostname(hostname: string) {
  return publicHosts.has(hostname.toLowerCase());
}

function ProtectedLayout() {
  const location = useLocation();
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => api.get<SessionDto>('/auth/session'),
    retry: false,
  });

  if (session.isPending) return <FullPageLoading label="Verificando sua sessão" />;
  if (session.error instanceof ApiError && session.error.status === 401) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (session.isError) {
    return (
      <main className="centered-state">
        <p className="eyebrow">Conexão indisponível</p>
        <h1>Não foi possível abrir o painel</h1>
        <p>Verifique se a API está ativa e tente novamente.</p>
        <button className="button primary" onClick={() => void session.refetch()}>Tentar novamente</button>
      </main>
    );
  }

  return (
    <AppShell email={session.data.email}>
      <Outlet />
    </AppShell>
  );
}

export function App({
  hostname = window.location.hostname,
  publicPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview'),
}: {
  hostname?: string;
  publicPreview?: boolean;
} = {}) {
  if (publicPreview || isPublicHostname(hostname)) return <PublicSite />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/ofertas" element={<OffersPage />} />
        <Route path="/ofertas/nova" element={<OfferFormPage />} />
        <Route path="/ofertas/:offerId" element={<OfferDetailPage />} />
        <Route path="/ofertas/:offerId/editar" element={<OfferFormPage />} />
        <Route path="/destinos" element={<DestinationsPage />} />
        <Route path="/historico" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
