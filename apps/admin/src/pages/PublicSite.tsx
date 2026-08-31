import { useEffect, type ReactNode } from 'react';
import '../public-site.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ExternalLink,
  MessageCircle,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Tag,
} from 'lucide-react';

const contactEmail = 'contato@elaco.com.br';

function DocumentMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;

    document.title = title;
    if (meta) meta.content = description;

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
    };
  }, [description, title]);

  return null;
}

function PublicHeader() {
  return (
    <header className="public-header">
      <a className="public-logo" href="/" aria-label="Elaco Promoções — página inicial">
        <span className="public-logo-mark" aria-hidden="true">e</span>
        <span>
          <strong>elaco</strong>
          <small>promoções</small>
        </span>
      </a>
      <nav className="public-nav" aria-label="Navegação principal">
        <a href="/#criterios">Critérios</a>
        <a href="/#transparencia">Transparência</a>
        <a href="/#canais">Canais</a>
      </nav>
      <a className="public-admin-link" href="https://admin.elaco.com.br/login">
        Área administrativa <ExternalLink aria-hidden="true" />
      </a>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-main">
        <a className="public-logo public-logo-light" href="/" aria-label="Elaco Promoções — página inicial">
          <span className="public-logo-mark" aria-hidden="true">e</span>
          <span>
            <strong>elaco</strong>
            <small>promoções</small>
          </span>
        </a>
        <p>Curadoria independente de ofertas, com revisão humana e publicidade identificada.</p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </div>
      <div className="public-footer-links" aria-label="Links institucionais">
        <a href="/privacidade">Privacidade</a>
        <a href="/termos">Termos de uso</a>
        <a href="https://admin.elaco.com.br/login">Área administrativa</a>
      </div>
      <p className="public-footer-disclosure">
        Como associado da Amazon, eu ganho com compras qualificadas. A Elaco pode receber comissões
        de outros programas de afiliados, sem custo adicional para você.
      </p>
    </footer>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}

function OfferTicket() {
  const steps = [
    ['Encontrada', 'Origem e destino identificados'],
    ['Conferida', 'Preço e mensagem revisados'],
    ['Publicada', 'Publicidade sinalizada'],
  ];

  return (
    <div className="public-radar-stage">
      <img
        className="public-hero-photo"
        src="/images/elaco-curadoria-hero.webp"
        alt="Mesa de curadoria com caixa, etiquetas, celular e materiais de conferência"
        width="928"
        height="1152"
        fetchPriority="high"
      />
      <div className="public-radar-rings" aria-hidden="true"><span /></div>
      <article className="public-offer-ticket">
        <header>
          <span>RADAR / REVISÃO 003</span>
          <Radar aria-hidden="true" />
        </header>
        <div className="public-ticket-copy">
          <p>Antes do alerta</p>
          <h2>A oferta passa por gente.</h2>
          <span>Sem escassez inventada. Sem link disfarçado.</span>
        </div>
        <ol className="public-ticket-rail">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span className="public-ticket-dot"><Check aria-hidden="true" /></span>
              <div>
                <small>0{index + 1}</small>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <footer>
          <span><ShieldCheck aria-hidden="true" /> Pronta para o canal</span>
          <small>#pub</small>
        </footer>
      </article>
    </div>
  );
}

function LandingPage() {
  return (
    <PublicLayout>
      <DocumentMeta
        title="Elaco Promoções — ofertas com contexto e transparência"
        description="Curadoria independente de ofertas da Amazon e do Mercado Livre, com revisão humana, links diretos e publicidade identificada."
      />
      <main id="conteudo">
        <section className="public-hero">
          <div className="public-hero-copy">
            <p className="public-kicker"><span>Curadoria humana</span> antes do disparo</p>
            <h1>Oferta boa não precisa de <em>pressa inventada.</em></h1>
            <p className="public-hero-lead">
              A Elaco encontra oportunidades na Amazon e no Mercado Livre, confere o que pode ser
              comprovado e publica com o destino e a publicidade à vista.
            </p>
            <div className="public-hero-actions">
              <a className="public-button public-button-primary" href="#criterios">
                Conheça os critérios <ArrowRight aria-hidden="true" />
              </a>
              <a className="public-button public-button-secondary" href="#transparencia">
                Como a Elaco ganha
              </a>
            </div>
            <div className="public-hero-note">
              <ShieldCheck aria-hidden="true" />
              <span>Links diretos para a loja. A decisão de compra continua sendo sua.</span>
            </div>
          </div>
          <OfferTicket />
        </section>

        <section className="public-proof-strip" aria-label="Compromissos da Elaco">
          <p><span>01</span> Destino identificado</p>
          <p><span>02</span> Revisão antes de publicar</p>
          <p><span>03</span> Publicidade sinalizada</p>
        </section>

        <section className="public-process" id="criterios">
          <div className="public-section-heading">
            <p className="public-kicker"><span>O filtro</span> que vem antes do feed</p>
            <h2>Um desconto só entra no radar quando passa por quatro perguntas.</h2>
          </div>
          <div className="public-criteria-grid">
            <article>
              <span className="public-criterion-icon"><Search aria-hidden="true" /></span>
              <small>Preço</small>
              <h3>O valor está visível na fonte?</h3>
              <p>Registramos o preço disponível no momento da revisão, sem inventar histórico ou economia.</p>
            </article>
            <article>
              <span className="public-criterion-icon"><ExternalLink aria-hidden="true" /></span>
              <small>Destino</small>
              <h3>O link leva à loja certa?</h3>
              <p>Preservamos o destino real. Nada de encurtador obscuro ou página intermediária enganosa.</p>
            </article>
            <article>
              <span className="public-criterion-icon"><Tag aria-hidden="true" /></span>
              <small>Mensagem</small>
              <h3>A promessa cabe nos fatos?</h3>
              <p>Preço, benefício e disponibilidade precisam estar sustentados pela página do produto.</p>
            </article>
            <article>
              <span className="public-criterion-icon"><ShieldCheck aria-hidden="true" /></span>
              <small>Publicação</small>
              <h3>Está claro que é publicidade?</h3>
              <p>Cada oferta patrocinada recebe identificação próxima do link, antes de chegar ao canal.</p>
            </article>
          </div>
          <figure className="public-review-figure">
            <img
              src="/images/elaco-revisao-humana.webp"
              alt="Pessoa conferindo uma oferta no celular ao lado de anotações e etiquetas"
              width="1376"
              height="768"
              loading="lazy"
            />
            <figcaption>
              <span>REVISÃO HUMANA / ETAPA 02</span>
              <strong>Preço, texto e destino são conferidos antes do envio.</strong>
            </figcaption>
          </figure>
        </section>

        <section className="public-sequence" aria-labelledby="sequence-title">
          <div>
            <p className="public-kicker"><span>Do radar</span> para a comunidade</p>
            <h2 id="sequence-title">Automação ajuda no ritmo. A revisão decide o envio.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div><strong>Encontrar</strong><p>Reunimos dados do produto e o link da loja participante.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><strong>Conferir</strong><p>Uma pessoa revisa preço, texto, destino e sinalização publicitária.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><strong>Publicar</strong><p>O alerta aprovado segue para os canais escolhidos, com rastreabilidade.</p></div>
            </li>
          </ol>
        </section>

        <section className="public-transparency" id="transparencia">
          <div className="public-transparency-stamp" aria-hidden="true">#pub</div>
          <div>
            <p className="public-kicker public-kicker-light"><span>Transparência</span> não vai no rodapé miúdo</p>
            <h2>Podemos ganhar uma comissão quando você compra. O preço não aumenta por isso.</h2>
            <p>
              Como associado da Amazon, eu ganho com compras qualificadas. A Elaco também pode
              participar de outros programas de afiliados. Sempre identificamos conteúdo patrocinado
              e você escolhe se quer abrir o link.
            </p>
            <p className="public-independence-note">
              Amazon e Mercado Livre não operam, patrocinam ou endossam a Elaco. Preços e estoque são
              definidos pelas lojas e podem mudar depois da publicação.
            </p>
          </div>
        </section>

        <section className="public-channels" id="canais">
          <div className="public-section-heading">
            <p className="public-kicker"><span>Canais</span> feitos para alertas, não para ruído</p>
            <h2>Escolha onde acompanhar quando as comunidades abrirem.</h2>
          </div>
          <div className="public-channel-grid">
            <article>
              <Send aria-hidden="true" />
              <div><small>Telegram</small><h3>Alertas rápidos e organizados</h3><p>Ofertas revisadas em um canal fácil de silenciar, buscar e consultar.</p></div>
            </article>
            <article>
              <MessageCircle aria-hidden="true" />
              <div><small>WhatsApp</small><h3>Grupos com entrada voluntária</h3><p>Distribuição apenas para comunidades que escolheram receber as mensagens.</p></div>
            </article>
          </div>
          <div className="public-contact-band">
            <div><strong>Quer falar com a Elaco?</strong><span>Parcerias, dúvidas e solicitações de privacidade.</span></div>
            <a className="public-button public-button-primary" href={`mailto:${contactEmail}`}>
              Enviar e-mail <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="public-faq" aria-labelledby="faq-title">
          <div className="public-section-heading">
            <p className="public-kicker"><span>Antes do clique</span> respostas diretas</p>
            <h2 id="faq-title">O que vale saber sobre as ofertas.</h2>
          </div>
          <div className="public-faq-list">
            <details>
              <summary>A Elaco é uma loja?</summary>
              <p>Não. A Elaco faz curadoria e divulgação. Compra, pagamento, entrega e suporte acontecem na loja indicada pelo link.</p>
            </details>
            <details>
              <summary>O preço publicado é garantido?</summary>
              <p>Não. Preço e estoque podem mudar rapidamente. Confira as condições finais diretamente na loja antes de comprar.</p>
            </details>
            <details>
              <summary>Todo link gera comissão?</summary>
              <p>Nem sempre. Quando houver relação de afiliado, a publicação será identificada de forma clara perto do link.</p>
            </details>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  return (
    <PublicLayout>
      <DocumentMeta
        title={`${privacy ? 'Política de Privacidade' : 'Termos de Uso'} — Elaco Promoções`}
        description={`${privacy ? 'Política de privacidade' : 'Termos de uso'} da Elaco Promoções.`}
      />
      <main className="public-legal" id="conteudo">
        <a className="public-back-link" href="/"><ArrowRight aria-hidden="true" /> Voltar para o início</a>
        <p className="public-kicker"><span>Documento público</span> atualizado em 31 de agosto de 2026</p>
        <h1>{privacy ? 'Política de Privacidade' : 'Termos de Uso'}</h1>
        <p className="public-legal-intro">
          {privacy
            ? 'Esta política explica quais dados podem ser tratados ao acessar a página pública da Elaco e como você pode falar conosco.'
            : 'Estes termos explicam o papel da Elaco, os limites das informações publicadas e as responsabilidades de quem acessa nossas ofertas.'}
        </p>
        {privacy ? <PrivacyContent /> : <TermsContent />}
      </main>
    </PublicLayout>
  );
}

function PrivacyContent() {
  return (
    <div className="public-legal-sections">
      <section><h2>1. Quem somos</h2><p>A Elaco Promoções é uma curadoria independente de ofertas. Para assuntos de privacidade, escreva para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p></section>
      <section><h2>2. Dados tratados</h2><p>A página pública não possui cadastro, newsletter ou formulário. O servidor pode registrar endereço IP, data, rota acessada, navegador e informações técnicas necessárias para segurança e diagnóstico.</p></section>
      <section><h2>3. Cookies e links externos</h2><p>A página pública não utiliza cookies de publicidade próprios. Ao abrir um link de loja ou serviço externo, o terceiro poderá tratar dados conforme a própria política de privacidade.</p></section>
      <section><h2>4. Finalidades e retenção</h2><p>Registros técnicos são usados para manter o serviço disponível, prevenir abuso e investigar falhas. Eles são mantidos somente pelo período necessário a essas finalidades e às obrigações legais aplicáveis.</p></section>
      <section><h2>5. Compartilhamento e segurança</h2><p>Não vendemos dados pessoais. Fornecedores de infraestrutura podem processar dados técnicos estritamente para hospedar e proteger o site. Aplicamos controles de acesso e conexão criptografada.</p></section>
      <section><h2>6. Seus direitos</h2><p>Você pode solicitar confirmação, acesso, correção ou eliminação de dados, quando aplicável, pelo e-mail de contato. Poderemos pedir informações suficientes para confirmar a identidade do solicitante.</p></section>
      <section><h2>7. Alterações</h2><p>Esta política poderá mudar quando novos recursos forem adicionados. A data de atualização será mantida no início desta página.</p></section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="public-legal-sections">
      <section><h2>1. Natureza do serviço</h2><p>A Elaco pesquisa, revisa e divulga ofertas de terceiros. Não somos a loja, o vendedor, o fabricante, a transportadora ou o meio de pagamento.</p></section>
      <section><h2>2. Preços e disponibilidade</h2><p>Informações refletem o momento da revisão e podem mudar sem aviso. A condição válida é a apresentada pela loja no fechamento da compra.</p></section>
      <section><h2>3. Links de afiliados</h2><p>Alguns links podem gerar comissão para a Elaco sem custo adicional para você. Como associado da Amazon, eu ganho com compras qualificadas. Conteúdo publicitário será identificado próximo ao link.</p></section>
      <section><h2>4. Decisão de compra</h2><p>Você é responsável por avaliar produto, vendedor, preço, frete, prazo, garantia e política de devolução antes de concluir a compra.</p></section>
      <section><h2>5. Marcas e terceiros</h2><p>Marcas pertencem aos respectivos titulares. A menção a uma loja não implica patrocínio, parceria institucional ou endosso à Elaco.</p></section>
      <section><h2>6. Uso aceitável</h2><p>Não é permitido tentar comprometer a segurança do serviço, automatizar acessos abusivos ou usar o conteúdo para enganar terceiros.</p></section>
      <section><h2>7. Contato e alterações</h2><p>Dúvidas podem ser enviadas para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Estes termos poderão ser atualizados para refletir mudanças no serviço ou na legislação.</p></section>
    </div>
  );
}

export function PublicSite() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="/privacidade" element={<LegalPage kind="privacy" />} />
      <Route path="/termos" element={<LegalPage kind="terms" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
