import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LockKeyhole, Radar } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { LoginInput, SessionDto } from '@radar/contracts';
import { api, errorMessage } from '../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const session = queryClient.getQueryData<SessionDto>(['session']);
  const login = useMutation({
    mutationFn: (input: LoginInput) => api.post<SessionDto>('/auth/login', input),
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data);
      const target = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(target, { replace: true });
    },
  });

  if (session) return <Navigate to="/" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-title">
        <div className="login-brand"><Radar size={24} /><span>Radar de ofertas</span></div>
        <div>
          <p className="eyebrow light">Central de publicação</p>
          <h1 id="login-title">Da oferta encontrada à mensagem entregue.</h1>
          <p>Prepare, revise e distribua promoções sem perder o controle do que já saiu.</p>
        </div>
        <div className="dispatch-ticket" aria-hidden="true">
          <span>FLUXO OPERACIONAL</span><strong>CAPTURAR · REVISAR · PUBLICAR</strong><small>AMAZON / MERCADO LIVRE</small>
        </div>
      </section>

      <section className="login-panel" aria-label="Acesso ao painel">
        <form className="login-form" onSubmit={submit}>
          <div className="form-heading">
            <span className="icon-box"><LockKeyhole size={20} /></span>
            <div><p className="eyebrow">Acesso restrito</p><h2>Entre no painel</h2></div>
          </div>
          <p className="muted">Use as credenciais definidas na configuração do servidor.</p>
          {login.isError && <div className="field-error" role="alert">{errorMessage(login.error)}</div>}
          <label className="field">
            <span>E-mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
          </label>
          <label className="field">
            <span>Senha</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
          </label>
          <button className="button primary wide" type="submit" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : <>Entrar no Radar <ArrowRight size={18} /></>}
          </button>
        </form>
      </section>
    </main>
  );
}
