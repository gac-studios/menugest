import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, BarChart3, ShoppingCart, Smartphone, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroFood from '@/assets/hero-food.jpg';

const features = [
  { icon: <UtensilsCrossed size={24} />, title: 'Cardápio Digital', desc: 'Menu online bonito e rápido para seus clientes' },
  { icon: <ShoppingCart size={24} />, title: 'Pedidos via WhatsApp', desc: 'Carrinho inteligente com envio direto pro WhatsApp' },
  { icon: <BarChart3 size={24} />, title: 'Gestão Completa', desc: 'Estoque, compras, vendas e relatório financeiro' },
  { icon: <Smartphone size={24} />, title: 'Mobile First', desc: 'Perfeito no celular, onde seus clientes estão' },
  { icon: <Zap size={24} />, title: 'Ultra Rápido', desc: 'Carregamento instantâneo, sem demora' },
  { icon: <Shield size={24} />, title: 'Multi-Empresa', desc: 'Cada negócio com seu subdomínio exclusivo' },
];

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
              <Button variant="ghost" size="sm">Planos</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0">Começar Grátis</Button>
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
                  <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
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
            <a href="https://wa.me/5534932466279?text=Olá, quero saber mais sobre o MenuGest" target="_blank" rel="noopener">
              <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <UtensilsCrossed size={12} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">MenuGest</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 MenuGest. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground">WhatsApp: (34) 3246-6279</p>
        </div>
      </footer>
    </div>
  );
}
