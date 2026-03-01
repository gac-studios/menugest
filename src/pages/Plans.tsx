import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Crown, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MENUGEST_WHATSAPP, openWhatsApp } from '@/lib/whatsapp';
import { useState } from 'react';

const plans = [
  {
    name: 'Básico',
    subtitle: 'Menu Digital',
    price: '49,90',
    popular: false,
    features: [
      { text: 'Cardápio digital completo', included: true },
      { text: 'Promoções destacadas', included: true },
      { text: 'Carrinho → WhatsApp', included: true },
      { text: 'Até 10 categorias', included: true },
      { text: 'Até 50 itens', included: true },
      { text: 'Estatística de pedidos', included: true },
      { text: 'Marca d\'água MenuGest', included: true },
      { text: 'Gestão de estoque', included: false },
      { text: 'Registro de compras', included: false },
      { text: 'Registro de vendas', included: false },
      { text: 'Relatório financeiro', included: false },
      { text: 'Gráficos de desempenho', included: false },
    ],
  },
  {
    name: 'Pro',
    subtitle: 'Gestão Completa',
    price: '99,90',
    popular: true,
    features: [
      { text: 'Tudo do Básico incluído', included: true },
      { text: 'Categorias ilimitadas', included: true },
      { text: 'Itens ilimitados', included: true },
      { text: 'Sem marca d\'água', included: true },
      { text: 'Gestão de estoque', included: true },
      { text: 'Registro de compras', included: true },
      { text: 'Registro de vendas', included: true },
      { text: 'Relatório financeiro mensal', included: true },
      { text: 'Cálculo automático de lucro', included: true },
      { text: 'Gráficos de desempenho', included: true },
      { text: 'Exportar Excel e PDF', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
];

export default function Plans() {
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
          <Link to="/login">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl lg:text-5xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="mt-4 text-muted-foreground text-lg">Comece a receber pedidos hoje mesmo</p>
        </motion.div>

        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border-2 p-8 bg-card ${
                plan.popular
                  ? 'border-primary shadow-elevated'
                  : 'border-border shadow-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Crown size={12} /> Recomendado
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">R$ {plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <Check size={16} className="text-success shrink-0" />
                    ) : (
                      <X size={16} className="text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gradient-primary text-primary-foreground border-0 text-base"
                size="lg"
                onClick={() => {
                  const msg = plan.name === 'Pro'
                    ? 'Olá, quero contratar o plano Pro do MenuCash'
                    : 'Olá, quero contratar o plano Básico do MenuCash';
                  window.open(`https://wa.me/553432466279?text=${encodeURIComponent(msg)}`, '_blank');
                }}
              >
                Contratar no WhatsApp
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
