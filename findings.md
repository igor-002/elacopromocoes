# Findings & Decisions

## Requirements
- MVP monetizável, não SaaS.
- TypeScript com NestJS; painel web simples.
- Amazon e Mercado Livre com cadastro manual inicial.
- Vários canais/grupos Telegram e WhatsApp.
- Evolution API incluída no Docker.
- Revisão manual, envio imediato ou agendado.
- Templates com OpenAI opcional.
- Desenvolvimento local seguido de VPS Docker.

## Research Findings
- Amazon Creators API exige conta aceita e vendas qualificadas recentes; integração automática deve permanecer opcional.
- Mercado Livre oferece geração manual de links na Central de Afiliados; catálogo público não substitui link comissionado.
- Links devem permanecer diretos e identificados como publicidade.
- Evolution API é integração não oficial e deve ficar isolada atrás de adaptador.
- Repositório oficial atual usa `evoapicloud/evolution-api`; configuração de referência expõe somente localhost e separa PostgreSQL/Redis.
- Evolution v2.3.7 confirma `POST /message/sendMedia/{instance}` com `number`, `mediatype`, `mimetype`, `media` e `caption`; autenticação usa header `apikey`.
- Há relatos recentes de instabilidade no envio da v2.3.7; falhas e estado incerto precisam permanecer visíveis ao operador.
- Docker local está ativo na versão 29.2.1; imagens PostgreSQL 17, Redis 7, Node 22 e Caddy já existem.
- Python não está instalado; pesquisa automatizada do UI/UX Pro Max não pôde executar. Diretrizes gerais da skill serão usadas como fallback.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Monorepo npm workspaces | Compartilha tipos sem ferramenta adicional |
| API REST + Zod | Contratos explícitos e validação reaproveitável |
| Prisma | Schema e migrations simples para TypeScript |
| BullMQ | Agendamento e retentativa persistentes |
| React Query | Cache e estados assíncronos previsíveis no painel |
| CSS próprio com tokens | Identidade visual sem dependência pesada |
| Estado `UNKNOWN` em timeout | Evita retentativa automática após possível entrega |
| Soft delete de destinos | Preserva histórico de publicações |
| Credenciais de integrações por ambiente | Evita segredos no banco e mantém admin único simples |

## Integration Review
- Backend e frontend usam as mesmas rotas `/api/auth`, `/api/offers`, `/api/destinations`, `/api/publications` e `/api/dashboard`.
- Atualização parcial de oferta é revalidada após merge com registro persistido.
- Cada destino gera uma publicação e job próprios; o job ID igual ao ID da publicação reduz duplicação de fila.
- Painel cobre login, dashboard, CRUD editorial, aprovação, múltiplos destinos, agendamento, retry e cancelamento.
- Auditoria npm encontrou `GHSA-ggr8-5vv4-36mx` somente na ferramenta Prisma 6.19; pin coordenado de CLI e client em 6.12.0 remove o pacote vulnerável.

## Resources
- https://associados.amazon.com.br/creatorsapi/docs/en-us/introduction
- https://associados.amazon.com.br/help/operating/policies/
- https://www.mercadolivre.com.br/l/comece-a-recomendar
- https://core.telegram.org/bots/api
- https://github.com/evolution-foundation/evolution-api/blob/main/docker-compose.yaml
- https://github.com/evolution-foundation/evolution-api/blob/main/src/api/routes/sendMessage.router.ts

## Visual Direction
- Produto: painel operacional para afiliado solo revisar ofertas antes do disparo.
- Job principal: transformar dados de produto em publicação confiável, rastreável e sem duplicidade.
- Assinatura: trilha de estados inspirada em etiquetas de preço destacáveis.
- Paleta: porcelana fria, grafite, azul operacional e laranja de oferta; evitar visual financeiro genérico.
- Tipos: Space Grotesk para títulos, Instrument Sans para interface e IBM Plex Mono para preços/IDs.

## Auditoria de retomada — 2026-09-01
- O Git local está em `main`, com o commit `5c58c15` no topo; somente `image.png` permanece local e fora do versionamento.
- Entregas versionadas: MVP administrativo, landing pública da Elaco e status/descoberta de grupos da Evolution API.
- A última verificação conhecida da VPS mostrou PostgreSQL, Redis, API, painel e Evolution saudáveis, com os quatro domínios respondendo por HTTPS.
- A instância WhatsApp ainda depende da compra do número, criação/conexão da instância `radar` e leitura do QR Code.
- `compose.prod.yml` ainda não injeta `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_PARTNER_TAG` e `AMAZON_MARKETPLACE` na API, embora a importação Amazon exista no código e esteja descrita no README.
- A landing atual apresenta a marca, mas ainda não possui catálogo público, páginas individuais de ofertas, CTA de entrada no grupo nem medição do funil.
- Para reduzir risco contratual e melhorar medição, o caminho recomendado é WhatsApp → página da oferta na Elaco → clique consciente no link de afiliado, sem redirecionamento automático.
- Verificação ao vivo em 2026-09-01: `elaco.com.br`, `admin.elaco.com.br/login`, `api.elaco.com.br/api/health` e `evolution.elaco.com.br` responderam HTTP 200.
- O healthcheck público retornou banco e Redis ativos, Evolution configurada, Telegram desativado e OpenAI desativado.
- O bundle público contém a landing da Elaco, mas não contém o texto do seletor de grupos; portanto, o commit `5c58c15` ainda precisa ser implantado na VPS.
