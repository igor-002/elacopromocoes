# Elaco Promoções — Status e próximos passos

Atualizado em: **1º de setembro de 2026**

Repositório: https://github.com/igor-002/elacopromocoes

VPS: `209.50.255.122`

Este é o documento de retomada do projeto. Ao voltar ao trabalho, comece pela seção **Próxima sequência recomendada**.

## Resumo rápido

O MVP está desenvolvido, testado, publicado no GitHub e parcialmente implantado na VPS. A landing pública, o painel administrativo, a API, PostgreSQL, Redis e a Evolution API estão online. O que impede o uso real hoje é principalmente a conexão de um número WhatsApp, a criação do primeiro grupo, o deploy do último commit e a configuração definitiva da conta de afiliado Amazon.

## Estado verificado hoje

| Componente | Endereço | Estado |
|---|---|---|
| Site público | https://elaco.com.br | HTTP 200 |
| Painel | https://admin.elaco.com.br/login | HTTP 200 e HTTPS |
| API | https://api.elaco.com.br/api/health | HTTP 200 |
| Evolution Manager/API | https://evolution.elaco.com.br | HTTP 200 |
| PostgreSQL | Interno no Docker | Ativo |
| Redis/BullMQ | Interno no Docker | Ativo |
| Telegram | Integração disponível | Desativado |
| OpenAI | Integração disponível | Desativado |
| Evolution | Variáveis configuradas | Número/instância ainda não confirmados como conectados |

> O healthcheck mostrar `evolution: configured` significa apenas que URL, chave e nome da instância existem no ambiente. A conexão real só estará pronta quando a instância `radar` retornar estado `open` após o QR Code.

## O que já foi concluído

### Produto e painel

- [x] Login administrativo.
- [x] Dashboard operacional.
- [x] Cadastro e edição de ofertas Amazon e Mercado Livre.
- [x] Rascunho, revisão e aprovação manual.
- [x] Geração de texto por template.
- [x] OpenAI opcional.
- [x] Publicação imediata ou agendada.
- [x] Múltiplos destinos.
- [x] Histórico, retentativa e cancelamento.
- [x] Proteção contra reenvio automático quando a entrega fica incerta.

### Infraestrutura

- [x] Docker Compose com PostgreSQL, Redis, API, painel e Evolution API.
- [x] Deploy na VPS em `/opt/elacopromocoes`.
- [x] Integração com o Nginx do painel ICP.
- [x] Portas internas presas a `127.0.0.1`.
- [x] SSL nos quatro domínios.
- [x] Healthchecks dos containers.
- [x] Repositório público no GitHub.

### Site público

- [x] Landing institucional da Elaco.
- [x] Página de privacidade.
- [x] Termos de uso e aviso de afiliado.
- [x] Identidade visual e imagens próprias.
- [ ] Catálogo público de ofertas.
- [ ] Página individual de cada oferta.
- [ ] Botão real para entrar no grupo.
- [ ] Analytics do funil.

### WhatsApp/Evolution

- [x] Evolution API 2.3.7 rodando na VPS.
- [x] Proxy e HTTPS da Evolution.
- [x] Envio para grupos implementado no backend.
- [x] Status real da conexão implementado.
- [x] Descoberta automática dos grupos implementada.
- [x] Seletor de grupo implementado no painel.
- [ ] Implantar na VPS o commit `5c58c15` com status e seletor de grupos.
- [ ] Comprar/ativar o número dedicado.
- [ ] Criar ou conectar a instância `radar` pelo QR Code.
- [ ] Criar o primeiro grupo e cadastrar como destino.
- [ ] Fazer o primeiro envio real controlado.

## Pendências encontradas na auditoria

1. **Último commit ainda não implantado:** o GitHub está em `5c58c15`, mas o bundle público da VPS ainda não contém o seletor automático de grupos.
2. **Número WhatsApp:** falta ativar o chip/eSIM e registrar o WhatsApp Business.
3. **Grupo inicial:** falta criar o grupo oficial da Elaco e configurar somente administradores para enviar.
4. **Amazon Creators API em produção:** a integração existe no código, mas `compose.prod.yml` ainda não passa `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_PARTNER_TAG` e `AMAZON_MARKETPLACE` para o container da API.
5. **Conta de afiliado:** confirmar aprovação, tag e sites/canais declarados na Amazon.
6. **Catálogo público:** hoje a landing apresenta a marca, mas não exibe ofertas individuais.
7. **Aquisição e métricas:** ainda não existem CTA real, eventos de conversão, UTMs ou medição de entrada no grupo.
8. **Backups automáticos:** o procedimento está documentado, mas falta confirmar agendamento e armazenamento externo.

## Próxima sequência recomendada

### Etapa 1 — Atualizar a VPS

Na VPS:

```bash
cd /opt/elacopromocoes
git pull origin main
docker compose --env-file docker/.env.production -f compose.prod.yml -f compose.icp.yml --profile whatsapp up -d --build
docker compose --env-file docker/.env.production -f compose.prod.yml -f compose.icp.yml --profile whatsapp ps
curl -fsS http://127.0.0.1:3001/api/health
```

Resultado esperado: todos os containers saudáveis e o painel mostrando o estado da Evolution na tela de destinos.

### Etapa 2 — Preparar o WhatsApp

1. Ativar o número dedicado.
2. Instalar e configurar o WhatsApp Business com nome, logo, site e e-mail da Elaco.
3. Abrir `https://evolution.elaco.com.br/manager/`.
4. Criar ou abrir a instância `radar`.
5. Ler o QR Code em **WhatsApp → Aparelhos conectados**.
6. Confirmar que o estado ficou `open`/conectado.

### Etapa 3 — Criar o primeiro grupo

Nome sugerido: **Elaco | Ofertas verificadas**.

- Somente administradores enviam mensagens.
- Entrada apenas por convite voluntário.
- Descrição informa frequência, finalidade e links de afiliado.
- Começar com 3 a 5 boas ofertas por dia.
- Preparar pelo menos 10 ofertas antes de convidar as primeiras pessoas.

Depois, no painel:

1. Acessar **Destinos → Novo destino → WhatsApp**.
2. Confirmar o aviso “instância conectada”.
3. Selecionar o grupo carregado automaticamente.
4. Salvar e usar **Testar**.

### Etapa 4 — Fechar a integração Amazon

1. Confirmar aprovação no Programa de Associados.
2. Confirmar a tag de afiliado.
3. Cadastrar `elaco.com.br` como site usado no programa.
4. Guardar credenciais somente no `docker/.env.production` da VPS.
5. Adicionar as variáveis Amazon ao `compose.prod.yml`.
6. Recriar o container da API.
7. Importar uma oferta como rascunho e validar preço, imagem, copy e tag do link.

## Próxima evolução do produto

O desenvolvimento mais valioso depois do primeiro envio real é criar o catálogo público:

```text
Instagram / anúncio / busca
           ↓
      elaco.com.br
           ↓
 página da oferta na Elaco
           ↓ clique consciente
      loja / Amazon
```

Isso permite medir tráfego, atualizar ofertas expiradas, apresentar o aviso de afiliado perto do botão e evitar redirecionamento automático.

## Estratégia para atrair pessoas

Não existe atalho sustentável para criar um grupo cheio. Comprar membros, listas ou adicionar desconhecidos tende a produzir denúncias, bloqueios e nenhuma venda. Um grupo pequeno e engajado vale mais do que milhares de participantes falsos.

### Funil recomendado

```text
Conteúdo ou parceria
        ↓
Landing da Elaco
        ↓
Pessoa entende o que receberá
        ↓
Entrada voluntária no grupo
        ↓
Ofertas revisadas e relevantes
        ↓
Clique e compra qualificada
```

### Canais viáveis de aquisição

#### 1. Conteúdo orgânico

Criar Instagram, TikTok e Facebook da Elaco com:

- Comparações de preço.
- Cupons encontrados.
- Três ofertas que realmente valem a pena hoje.
- Vídeos curtos mostrando o benefício do produto.
- Alertas de promoções relâmpago.
- CTA para entrar gratuitamente no grupo da Elaco.

É o canal mais barato e seguro para começar, embora leve tempo.

#### 2. Parcerias com microcriadores

Buscar páginas de tecnologia, casa, beleza, maternidade, games, economia e comunidades locais. Começar com perfis menores e público engajado. Negociar teste pequeno por valor fixo ou participante válido, sem comprar listas.

#### 3. Divulgação autorizada em comunidades

Conversar primeiro com administradores de grupos de bairros, universidades, condomínios e nichos. Publicar o convite somente com autorização.

#### 4. Indicação pelos próprios membros

Depois que o grupo já estiver entregando valor, pedir que os participantes compartilhem o convite com alguém interessado. Não condicionar recompensa a clique ou compra na Amazon.

#### 5. Anúncios pagos

Começar somente depois de medir cliques e comissões orgânicas. Teste inicial sugerido: orçamento pequeno por sete dias, levando o anúncio à landing, não adicionando pessoas diretamente ao grupo.

Métricas mínimas:

- Custo por visitante.
- Conversão da landing em entrada no grupo.
- Permanência após 7 e 30 dias.
- Cliques por oferta.
- Receita média por participante.
- Cancelamentos, saídas e denúncias.

Não escalar enquanto a receita esperada por participante for menor que o custo de aquisição.

## Organização dos grupos

Começar com apenas um grupo geral. Separar categorias somente quando houver audiência suficiente:

- Elaco | Tecnologia e Games.
- Elaco | Casa e Cozinha.
- Elaco | Beleza e Cuidados.
- Elaco | Ofertas abaixo de R$100.

Regras sugeridas:

- Somente administradores publicam.
- Entre 3 e 5 ofertas de qualidade por dia no início.
- Não repetir produto sem mudança relevante.
- Remover rapidamente oferta vencida do catálogo público.
- Identificar conteúdo publicitário e relação de afiliado.
- Nunca prometer preço ou estoque sem confirmação.

## Segurança e conformidade

### WhatsApp

- Não adicionar pessoas sem consentimento.
- Não comprar ou extrair números.
- Oferecer entrada e saída simples.
- Evitar mensagens em massa e frequência agressiva.
- Usar número exclusivo para a operação.
- Manter Telegram como canal alternativo.

A Evolution usa integração não oficial baseada no WhatsApp Web. Ela pode desconectar ou sofrer bloqueio. Se a operação crescer, avaliar a API oficial da Meta para comunicações individuais consentidas e manter grupos sob administração cuidadosa.

### Afiliados Amazon

- Cadastrar corretamente o site e os canais utilizados.
- Usar somente a tag aprovada.
- Informar de forma clara a relação de afiliado.
- Não inventar desconto, estoque, avaliação ou urgência.
- Não redirecionar automaticamente à Amazon.
- Caminho preferido: mensagem → página da oferta na Elaco → botão consciente para a Amazon.
- Antes de disparar links diretamente em grupos, pedir confirmação por escrito ao suporte do Programa de Associados sobre o canal utilizado.

Referências:

- WhatsApp Business: https://business.whatsapp.com/policy/
- Diretrizes de mensagens: https://www.whatsapp.com/legal/messaging-guidelines
- Associados Amazon: https://associados.amazon.com.br/help/operating/policies/

## Plano inicial de 30 dias

### Semana 1 — Preparação

- Atualizar a VPS.
- Conectar o número.
- Criar grupo e identidade do WhatsApp Business.
- Configurar Amazon.
- Preparar 10 a 20 ofertas revisadas.

### Semana 2 — Primeiros participantes

- Convidar somente contatos que aceitarem participar.
- Publicar conteúdo diário nas redes.
- Validar frequência e qualidade das ofertas.
- Observar saídas e dúvidas recorrentes.

### Semana 3 — Parcerias

- Testar 3 a 5 microcriadores ou comunidades autorizadas.
- Usar links/UTMs distintos por campanha, sem identificar individualmente usuários.
- Medir participantes válidos e retenção.

### Semana 4 — Otimização

- Comparar canais de aquisição.
- Remover campanhas ruins.
- Melhorar categorias e horários.
- Só então decidir se vale testar anúncio pago.

## Critério para considerar o MVP operando

- [ ] Último commit implantado na VPS.
- [ ] Número dedicado conectado à instância `radar`.
- [ ] Primeiro grupo sincronizado no painel.
- [ ] Mensagem de teste entregue.
- [ ] Conta/tag Amazon confirmada.
- [ ] Primeira oferta real revisada e publicada.
- [ ] Aviso de afiliado visível.
- [ ] Backup automático confirmado.
- [ ] Primeiros participantes entraram voluntariamente.
- [ ] Cliques e resultados começaram a ser medidos.

## Ao retomar

Pergunta inicial recomendada para a próxima sessão:

> Vamos continuar pelo `STATUS_E_PROXIMOS_PASSOS.md`. Já tenho o número? O commit `5c58c15` já foi implantado na VPS?
