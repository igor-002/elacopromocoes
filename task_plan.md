# Task Plan: Bot de Promoções

## Goal
Entregar um MVP executável para cadastrar, revisar, agendar e publicar ofertas da Amazon e Mercado Livre em Telegram e WhatsApp.

## Current Phase
Phase 6

## Phases

### Phase 1: Fundação e contratos
- [x] Definir estrutura do monorepo e design visual
- [x] Criar configuração e contratos compartilhados
- [ ] Preparar ambiente Docker e documentação inicial
- **Status:** complete

### Phase 2: Backend funcional
- [ ] Implementar autenticação, ofertas, destinos e publicações
- [ ] Implementar templates, OpenAI opcional e filas
- [ ] Implementar Telegram e Evolution API
- **Status:** complete

### Phase 3: Painel administrativo
- [ ] Implementar login, dashboard, ofertas, destinos e histórico
- [ ] Garantir responsividade e acessibilidade
- **Status:** complete

### Phase 4: Testes e verificação
- [ ] Executar testes unitários, integração, lint e build
- [ ] Validar Docker Compose e documentação
- [ ] Corrigir falhas encontradas
- **Status:** complete

### Phase 5: Entrega
- [ ] Revisar escopo e segurança
- [ ] Registrar resultados e limitações
- [ ] Entregar instruções de uso
- **Status:** complete

### Phase 6: Go-live dos canais
- [x] Publicar landing, painel, API e Evolution com HTTPS
- [x] Implementar status real e descoberta de grupos da Evolution
- [ ] Implantar o commit `5c58c15` na VPS
- [ ] Ativar número, conectar instância `radar` e sincronizar o primeiro grupo
- [ ] Configurar credenciais Amazon no Compose de produção
- [ ] Realizar a primeira publicação real controlada
- **Status:** in_progress

### Phase 7: Catálogo público e aquisição
- [ ] Criar páginas públicas de catálogo e detalhe de oferta
- [ ] Implementar CTA consentido para entrada no grupo
- [ ] Adicionar métricas de origem, clique, entrada e retenção
- [ ] Executar plano inicial de aquisição orgânica e parcerias
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| TypeScript, NestJS e React/Vite | Escolha confirmada pelo usuário para acelerar o MVP |
| PostgreSQL, Prisma, Redis e BullMQ | Persistência, agendamento e retentativas robustas |
| Cadastro manual primeiro | APIs de afiliados ainda não disponíveis |
| Amazon e Mercado Livre | Escopo confirmado pelo usuário |
| Telegram e Evolution API | Canais confirmados pelo usuário |
| Admin único | Evita complexidade SaaS fora do MVP |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `python` não encontrado ao executar pesquisa UI | 1 | Usar launcher `py -3` conforme instrução da skill |
| `py -3` também não encontrado | 2 | Verificar `python3`; se ausente, usar prioridades gerais da skill |
| `python3` também não encontrado | 3 | Tentar script via imagem Python já disponível no Docker; fallback para regras gerais |
| Orca CLI não disponível (`CommandNotFoundException`) | 1 | Usar subagentes nativos com fronteiras de arquivo; sem afirmar isolamento por worktree |

| `npm install` sem progresso por 150s no sandbox | 1 | Interrompido; repetir com acesso de rede escalado |
| Prisma não baixou query engine no sandbox | 1 | Repetir `db:generate` com acesso de rede escalado |
| Healthcheck chamou `ping` fora do tipo público BullMQ | 1 | Usar `queue.getJobCounts`, operação pública que valida Redis |

| `exactOptionalPropertyTypes` rejeitou props/matcher no painel | 1 | Normalizar `end` para boolean; usar matcher parcial |
| Vite não consumiu named exports do pacote CommonJS de contratos | 1 | Alias frontend aponta ao TypeScript fonte; backend mantém CommonJS compilado |
| `npm audit` não alcançou registry no sandbox | 1 | Repetir auditoria com rede escalada |
| Prisma 6.12 precisou baixar engine novo no sandbox | 2 | Repetir geração escalada após downgrade de segurança |
| `git diff --cached --check` encontrou espaços finais no novo Markdown | 1 | Trocar quebras forçadas por linhas em branco e repetir a validação |

## Parallel Roadmap
| Owner | Files | Deliverable |
|-------|-------|-------------|
| Backend agent | `apps/api/**` only | NestJS, Prisma, auth, offers, destinations, queue and adapters |
| Frontend agent | `apps/admin/**` only | React panel, responsive UX and API client |
| Infra agent | Docker/README only | Compose, images, Caddy, env and operations guide |
| Root agent | `packages/contracts/**`, root configs | Shared validation, dependency integration, review and verification |

## Stop Condition
Parar quando fluxo completo funcionar em modo local com integrações simuláveis: login, oferta, aprovação, agendamento, fan-out por destino, histórico e testes passando.
