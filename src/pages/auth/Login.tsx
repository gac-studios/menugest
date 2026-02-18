import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed size={22} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">MenuGest</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="text-muted-foreground mt-1 text-sm">Entre na sua conta para gerenciar seu negócio</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Esqueci minha senha</Link>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" size="lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed size={40} className="text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground">MenuGest</h2>
          <p className="mt-3 text-primary-foreground/60 max-w-xs">Gerencie seu cardápio digital e receba pedidos pelo WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
