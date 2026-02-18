import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">MenuGest</span>
        </Link>
        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">E-mail enviado!</h1>
            <p className="text-muted-foreground mt-2">Verifique sua caixa de entrada para redefinir sua senha.</p>
            <Link to="/login">
              <Button variant="outline" className="mt-6">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Esqueci minha senha</h1>
            <p className="text-muted-foreground mt-1 text-sm">Informe seu e-mail para recuperar o acesso</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1.5" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" size="lg" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-medium hover:underline">Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
