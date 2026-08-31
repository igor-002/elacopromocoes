# Radar de Ofertas

Painel operacional para cadastrar ofertas da Amazon e do Mercado Livre, revisar o texto e publicar em canais do Telegram ou grupos do WhatsApp. O MVP usa links de afiliado criados manualmente: não faz scraping, não promete preço histórico e não substitui a aprovação dos programas de afiliados.

## Arquitetura

```text
Navegador -> Caddy -> React
                  -> NestJS -> PostgreSQL
                           -> Redis/BullMQ
                           -> Telegram Bot API
                           -> Evolution API -> WhatsApp
```

- Node.js 22, NestJS e React/Vite em um monorepo npm.
- PostgreSQL 17 para ofertas, destinos, publicações e auditoria.
- Redis 7 e BullMQ para agendamentos e tentativas.
- Telegram pela API oficial; WhatsApp opcional pela Evolution API 2.3.7.
- Caddy termina HTTPS automaticamente na VPS.

## Uso local com Docker

Pré-requisitos: Docker Desktop/Engine com Compose v2.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

O painel fica em `http://localhost:5173`, a API em `http://localhost:3001/api` e o healthcheck em `http://localhost:3001/api/health`. O primeiro boot executa `prisma migrate deploy` antes de iniciar a API.

## Importação Amazon

O painel oferece busca e importação de produtos via Amazon Creators API. Cadastre-se no programa de Associados, habilite a Creators API e preencha `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET` e `AMAZON_PARTNER_TAG` no `.env`; o marketplace BR padrão é `www.amazon.com.br`. A rota usada pelo painel é `POST /api/offers/import/amazon` e cria ofertas como rascunho para revisão.

Para desenvolvimento com hot reload, suba somente as dependências e rode os apps no host:

```powershell
docker compose up -d postgres redis
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Telegram

1. Crie um bot no `@BotFather` e guarde o token.
2. Adicione o bot como administrador do canal ou participante do grupo.
3. Cadastre o destino no painel. Canais normalmente usam `@nome_do_canal`; grupos usam o `chat_id` numérico.
4. Faça o primeiro envio em um destino de teste.

Nunca salve tokens no Git. Use `.env` localmente e um arquivo de ambiente protegido na VPS.

## WhatsApp e QR Code

A Evolution API é opcional e fica no profile `whatsapp`:

```powershell
docker compose --profile whatsapp up -d --build
docker compose --profile whatsapp ps
```

Troque `EVOLUTION_API_KEY` antes do uso. Para criar a instância e salvar o QR como PNG no PowerShell:

```powershell
$apiKey = 'cole-aqui-a-mesma-EVOLUTION_API_KEY-do-.env'
$instance = 'radar'
$headers = @{ apikey = $apiKey }
$body = @{
  instanceName = $instance
  integration = 'WHATSAPP-BAILEYS'
  qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/instance/create' -Headers $headers -ContentType 'application/json' -Body $body
$qr = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/$instance" -Headers $headers
$value = if ($qr.base64) { $qr.base64 } else { $qr.qrcode.base64 }
$raw = $value -replace '^data:image/png;base64,', ''
[IO.File]::WriteAllBytes((Join-Path $PWD 'evolution-qr.png'), [Convert]::FromBase64String($raw))
```

Abra `evolution-qr.png` e, no celular, use **WhatsApp > Aparelhos conectados > Conectar um aparelho**. Confira o estado com:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/instance/connectionState/$instance" -Headers $headers
```

A porta 8080 é vinculada somente a `127.0.0.1`. Na VPS, acesse-a por túnel SSH em vez de publicá-la:

```bash
ssh -L 8080:127.0.0.1:8080 usuario@ip-da-vps
```

> A Evolution API usa um cliente não oficial do WhatsApp. Mudanças do WhatsApp podem quebrar sessões ou causar bloqueios. Use apenas grupos consentidos, limite a frequência, mantenha Telegram como alternativa e nunca trate esse canal como garantia de entrega.

## Deploy em VPS

Requisitos recomendados: Ubuntu recente, Docker, um domínio apontando para a VPS e portas 80/443 liberadas.

```bash
cp docker/env.production.example docker/.env.production
chmod 600 docker/.env.production
# edite todos os valores obrigatórios
docker compose --env-file docker/.env.production -f compose.prod.yml config --quiet
docker compose --env-file docker/.env.production -f compose.prod.yml up -d --build
```

Para incluir WhatsApp:

```bash
docker compose --env-file docker/.env.production -f compose.prod.yml --profile whatsapp up -d --build
```

### Deploy com Painel ICP

O ICP ocupa as portas 80/443 com o Nginx dele. Use o override abaixo para manter API, painel e Evolution acessíveis somente pelo host local, sem iniciar o Caddy do projeto:

```bash
docker compose --env-file docker/.env.production -f compose.prod.yml -f compose.icp.yml --profile whatsapp up -d --build
```

Configure no ICP três proxies reversos com SSL:

- `admin.example.com` para `http://127.0.0.1:8081`
- `api.example.com` para `http://127.0.0.1:3001`
- `evolution.example.com` para `http://127.0.0.1:8080`

Defina `APP_DOMAIN=admin.example.com` e `EVOLUTION_PUBLIC_URL=https://evolution.example.com`. Não publique PostgreSQL ou Redis. O perfil `standalone` continua disponível para VPS sem proxy próprio.

O Caddy obtém e renova TLS para `APP_DOMAIN`. Não exponha PostgreSQL, Redis ou a Evolution API na internet. Use senhas longas e compatíveis com URL no `POSTGRES_PASSWORD`; caso use caracteres reservados como `@`, `:` ou `/`, eles precisam estar percent-encoded nas URLs de conexão.

### Migrações e atualização

O container da API aplica migrations pendentes a cada inicialização. Para executá-las explicitamente antes de uma atualização:

```bash
docker compose --env-file docker/.env.production -f compose.prod.yml run --rm api npm run db:migrate -w @radar/api
docker compose --env-file docker/.env.production -f compose.prod.yml up -d --build
docker compose --env-file docker/.env.production -f compose.prod.yml ps
docker compose --env-file docker/.env.production -f compose.prod.yml logs --tail=100 api
```

O banco `evolution` é criado pelo script de inicialização apenas quando o volume do PostgreSQL nasce. Em um volume antigo, crie-o uma vez:

```bash
set -a
. docker/.env.production
set +a
docker compose --env-file docker/.env.production -f compose.prod.yml exec postgres createdb -U "$POSTGRES_USER" evolution
```

### Backup

Faça backup diário fora do diretório do projeto e teste a restauração periodicamente:

```bash
mkdir -p /var/backups/radar
set -a
. docker/.env.production
set +a
docker compose --env-file docker/.env.production -f compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > /var/backups/radar/radar-$(date +%F-%H%M).dump
docker compose --env-file docker/.env.production -f compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" -d evolution -Fc > /var/backups/radar/evolution-$(date +%F-%H%M).dump
```

Adapte usuário e bancos se alterou os padrões. Restrinja `/var/backups/radar` ao administrador, copie os dumps para outro servidor/storage e defina retenção. Uma restauração deve ser ensaiada em banco separado com `pg_restore` antes de ser necessária em produção.

## Operação e diagnóstico

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 redis postgres
docker compose --profile whatsapp logs --tail=100 evolution-api
```

- `postgres`, `redis`, `api`, `admin`, `caddy` e `evolution-api` têm healthchecks.
- Uma publicação é independente por destino; falhas devem aparecer no histórico antes de qualquer reenvio manual.
- Timeouts com entrega incerta não devem ser reenviados automaticamente, evitando mensagens duplicadas.
- Chaves, tokens, links privados e conteúdo de mensagens não devem aparecer em logs.

## Afiliados e conformidade

- **Amazon:** gere links com a tag da conta aprovada e identifique claramente publicidade e participação no Programa de Associados. A API automática fica para uma fase posterior, quando a conta for elegível. Consulte as [políticas do Programa de Associados](https://associados.amazon.com.br/help/operating/policies/) e a [Creators API](https://associados.amazon.com.br/creatorsapi/docs/en-us/introduction).
- **Mercado Livre:** gere o link comissionado na Central/Barra de Afiliados e publique somente em canais permitidos. Consulte o [programa oficial](https://www.mercadolivre.com.br/l/comece-a-recomendar).
- **Outras plataformas:** novos marketplaces entram por conectores, preservando cadastro, revisão, deduplicação e publicação. Shopee é uma candidata, mas deve ser habilitada somente após validar acesso, termos e forma oficial de gerar links.
- Inclua `#pub` ou divulgação equivalente em toda oferta, preserve o destino real do link e não invente descontos, estoque ou benefícios no texto gerado por IA.

## Limites do MVP

- Cadastro de produtos e links de afiliado é manual.
- Vendas e comissões permanecem nos painéis dos programas.
- OpenAI é opcional; sem chave, o sistema usa templates determinísticos.
- Não há scraping, redirecionador próprio, disparo para contatos sem consentimento nem publicação automática sem revisão.
