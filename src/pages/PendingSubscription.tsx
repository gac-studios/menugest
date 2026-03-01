import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ShieldX, UtensilsCrossed, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { openWhatsApp, MENUGEST_WHATSAPP } from '@/lib/whatsapp';

const POLL_INTERVAL = 10_000; // 10s

export default function PendingSubscription() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, refetch } = useTenant();
  const [pollingCount, setPollingCount] = useState(0);

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setPollingCount((c) => c + 1);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refetch]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Auto-redirect when plan is activated
  useEffect(() => {
    if (tenant?.subscription_status === 'active' && tenant.plan && tenant.plan !== 'none') {
      navigate('/dashboard', { replace: true });
    }
  }, [tenant, navigate]);

  const loading = authLoading || tenantLoading;
  const status = tenant?.subscription_status || 'pending';
  const requestedPlan = tenant?.requested_plan || tenant?.plan || 'basic';
  const planLabel = requestedPlan === 'pro' ? 'Pro (Gestão Completa)' : 'Básico (Menu Digital)';

  const handleWhatsApp = () => {
    const msg = `Olá, solicitei o plano ${planLabel} no MenuGest.\n\nEstabelecimento: ${tenant?.name || '—'}\nSlug: ${tenant?.slug || '—'}\nAguardo instruções de pagamento.`;
    openWhatsApp(MENUGEST_WHATSAPP, msg);
  };

  const handleReceipt = () => {
    const msg = `Olá, já realizei o pagamento do plano ${planLabel} no MenuGest.\n\nEstabelecimento: ${tenant?.name || '—'}\nSlug: ${tenant?.slug || '—'}\n\nSegue o comprovante:`;
    openWhatsApp(MENUGEST_WHATSAPP, msg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {status === 'blocked' ? (
            <div className="rounded-2xl border-2 border-destructive bg-card p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldX size={32} className="text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Conta bloqueada</h1>
              <p className="text-muted-foreground">
                Sua conta está bloqueada. Entre em contato com o suporte para mais informações.
              </p>
              <Button onClick={handleWhatsApp} className="w-full gradient-primary text-primary-foreground border-0" size="lg">
                <MessageCircle size={18} className="mr-2" />
                Falar com suporte
              </Button>
            </div>
          ) : status === 'active' ? (
            <div className="rounded-2xl border-2 border-primary bg-card p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Plano ativado!</h1>
              <p className="text-muted-foreground">
                Seu plano <strong>{planLabel}</strong> foi ativado com sucesso.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full gradient-primary text-primary-foreground border-0" size="lg">
                Entrar no painel
              </Button>
            </div>
          ) : (
            /* pending / any other status */
            <div className="rounded-2xl border-2 border-border bg-card p-8 text-center space-y-6 shadow-card">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock size={32} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Aguardando pagamento</h1>
                <p className="text-muted-foreground text-sm">
                  Seu pedido foi registrado e está pendente de liberação. Assim que o pagamento for confirmado, liberaremos seu plano.
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano solicitado</span>
                  <span className="font-semibold text-foreground">{planLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Pendente</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suporte</span>
                  <span className="font-semibold text-foreground">(34) 3246-6279</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleWhatsApp} className="w-full gradient-primary text-primary-foreground border-0" size="lg">
                  <MessageCircle size={18} className="mr-2" />
                  Abrir WhatsApp
                </Button>
                <Button onClick={handleReceipt} variant="outline" className="w-full" size="lg">
                  <Send size={18} className="mr-2" />
                  Já paguei / Enviar comprovante
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Esta página atualiza automaticamente. Você será redirecionado assim que o plano for ativado.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
