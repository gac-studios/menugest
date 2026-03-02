import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, BarChart3, ShoppingCart, Smartphone, Zap, Shield,
  ClipboardList, MessageSquare, Settings2,
  Beef, Pizza, Sandwich, IceCream, ChefHat, Truck,
  CheckCircle2, Globe, HeartHandshake, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import heroFood from '@/assets/hero-food.jpg';

const features = [
  { icon: <UtensilsCrossed size={24} />, title: 'Cardápio Digital', desc: 'Menu online bonito e rápido para seus clientes' },
  { icon: <ShoppingCart size={24} />, title: 'Pedidos via WhatsApp', desc: 'Carrinho inteligente com envio direto pro WhatsApp' },
  { icon: <BarChart3 size={24} />, title: 'Gestão Completa', desc: 'Estoque, compras, vendas e relatório financeiro' },
  { icon: <Smartphone size={24} />, title: 'Mobile First', desc: 'Perfeito no celular, onde seus clientes estão' },
  { icon: <Zap size={24} />, title: 'Ultra Rápido', desc: 'Carregamento instantâneo, sem demora' },
  { icon: <Shield size={24} />, title: 'Multi-Empresa', desc: 'Cada negócio com seu subdomínio exclusivo' },
];

const steps = [
  { num: '1', icon: <ClipboardList size={28} />, title: 'Crie seu cardápio', desc: 'Cadastre produtos, fotos, preços e categorias em minutos.' },
  { num: '2', icon: <MessageSquare size={28} />, title: 'Receba pedidos no WhatsApp', desc: 'Carrinho inteligente que envia o pedido formatado direto no seu WhatsApp.' },
  { num: '3', icon: <Settings2 size={28} />, title: 'Gerencie seu negócio', desc: 'Acompanhe pedidos e, no Pro, controle estoque, compras, vendas e relatórios.' },
];

const audiences = [
  { icon: <Beef size={20} />, label: 'Hamburguerias' },
  { icon: <Pizza size={20} />, label: 'Pizzarias' },
  { icon: <Sandwich size={20} />, label: 'Lanchonetes' },
  { icon: <IceCream size={20} />, label: 'Açaíterias' },
  { icon: <ChefHat size={20} />, label: 'Restaurantes' },
  { icon: <Truck size={20} />, label: 'Food trucks' },
];

const authorityPoints = [
  { icon: <HeartHandshake size={20} />, text: 'Atendimento e suporte direto pelo WhatsApp' },
  { icon: <CheckCircle2 size={20} />, text: 'Sem complicação: escolha o plano e a liberação é feita após confirmação' },
  { icon: <Monitor size={20} />, text: 'Funciona no celular e no computador' },
];

const faqs = [
  { q: 'Preciso baixar aplicativo?', a: 'Não. Você pode usar pelo navegador no celular ou computador. Se quiser, pode instalar como atalho (PWA) quando disponível.' },
  { q: 'Meus clientes precisam criar conta para pedir?', a: 'Não. Eles fazem o pedido no cardápio público e enviam direto para seu WhatsApp.' },
  { q: 'O MenuGest cobra taxa por pedido?', a: 'Não cobramos taxa por pedido. Você paga apenas a mensalidade do plano.' },
  { q: 'Como funciona o pagamento e a liberação do plano?', a: 'Você contrata pelo WhatsApp e, após confirmação do pagamento, liberamos o plano no sistema.' },
  { q: 'Posso mudar de plano depois?', a: 'Sim. Você pode solicitar upgrade pelo WhatsApp e liberamos assim que o pagamento for confirmado.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Você pode solicitar o cancelamento a qualquer momento.' },
  { q: 'Consigo personalizar as cores do cardápio?', a: 'Sim, você consegue personalizar o tema do cardápio e deixar com a identidade do seu negócio.' },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const } },
};

const WA_LINK = 'https://wa.me/5534932466279?text=Olá, quero saber mais sobre o MenuGest';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MenuGest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/plans">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0">Planos</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-border text-foreground bg-transparent hover:bg-muted">Entrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="gradient-hero">
          <div className="container mx-auto px-4 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center lg:text-left"
            >
              <h1 className="text-4xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
                Seu cardápio digital{' '}
                <span className="text-gradient">profissional</span>
              </h1>
              <p className="mt-6 text-lg text-primary-foreground/70 max-w-xl">
                Crie seu menu online, receba pedidos pelo WhatsApp e gerencie seu negócio de alimentação em um só lugar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register">
                  <Button size="lg" className="gradient-primary text-primary-foreground border-0 text-base px-8 shadow-elevated">
                    Criar Meu Cardápio
                  </Button>
                </Link>
                <Link to="/plans">
                  <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
                    Ver Planos
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 max-w-lg"
            >
              <img src={heroFood} alt="Comidas deliciosas" className="rounded-2xl shadow-elevated w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Tudo que você precisa</h2>
            <p className="mt-4 text-muted-foreground text-lg">Para transformar seu negócio de alimentação</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card shadow-card border border-border/50 hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Como funciona</h2>
            <p className="mt-4 text-muted-foreground text-lg">Três passos simples para começar</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-card shadow-card border border-border/50 text-center"
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-elevated">
                  {s.num}
                </span>
                <div className="mt-4 mb-4 flex justify-center text-primary">{s.icon}</div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 text-base px-8">Criar meu cardápio</Button>
            </Link>
            <Link to="/plans">
              <Button size="lg" variant="outline" className="text-base px-8">Ver planos</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Para quem é o MenuGest?</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Perfeito para negócios que vendem por WhatsApp e querem organização.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            {audiences.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-card border border-border/50 shadow-card hover:shadow-elevated transition-shadow"
              >
                <span className="text-primary">{a.icon}</span>
                <span className="font-medium text-foreground text-sm">{a.label}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.p
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-10 text-center text-muted-foreground max-w-xl mx-auto"
          >
            Se você já vende pelo WhatsApp, o MenuGest deixa seu cardápio bonito, rápido e pronto para pedidos.
          </motion.p>
        </div>
      </section>

      {/* Autoridade */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto rounded-2xl bg-card border border-border/50 shadow-card p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
                <Globe size={22} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Feito para negócios brasileiros</h3>
            </div>
            <ul className="space-y-4">
              {authorityPoints.map((p) => (
                <li key={p.text} className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">{p.icon}</span>
                  <span className="text-foreground/80 text-sm">{p.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Perguntas frequentes</h2>
            <p className="mt-4 text-muted-foreground text-lg">Tire suas dúvidas sobre o MenuGest</p>
          </motion.div>
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/50 rounded-xl px-5 shadow-card">
                  <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
          <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_LINK} target="_blank" rel="noopener">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 text-base px-8">Falar no WhatsApp</Button>
            </a>
            <Link to="/plans">
              <Button size="lg" variant="outline" className="text-base px-8">Ver planos</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-primary-foreground/70 text-lg">
            A partir de R$ 49,90/mês. Sem fidelidade.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 text-base px-8">
                Começar Agora
              </Button>
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener">
              <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <UtensilsCrossed size={14} className="text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground">MenuGest</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cardápio digital e gestão para negócios de alimentação.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/plans" className="hover:text-foreground transition-colors">Planos</Link></li>
                <li><Link to="/register" className="hover:text-foreground transition-colors">Criar conta</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link></li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                    WhatsApp: (34) 3246-6279
                  </a>
                </li>
                <li>Seg–Sex, 8h às 18h</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">Termos de uso</span></li>
                <li><span className="cursor-default">Política de privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MenuGest. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
