import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Radar de Ofertas: erro ao renderizar o painel', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="centered-state">
          <p className="eyebrow">Falha no painel</p>
          <h1>Não foi possível renderizar esta tela</h1>
          <p>Atualize a página. Se persistir, envie esta mensagem ao suporte:</p>
          <code>{this.state.error.message}</code>
          <button className="button primary" onClick={() => window.location.reload()}>Recarregar</button>
        </main>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
