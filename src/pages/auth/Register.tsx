import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UtensilsCrossed, Check, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const PASSWORD_RULES = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'lower', label: '1 letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'upper', label: '1 letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: '1 número', test: (p: string) => /\d/.test(p) },
];

function getStrength(password: string) {
  let score = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (password.length >= 12) score++;
  if (score <= 2) return { value: score * 20, label: 'Senha fraca', color: 'bg-destructive' };
  if (score <= 3) return { value: score * 20, label: 'Senha média', color: 'bg-warning' };
  return { value: score * 20, label: 'Senha forte', color: 'bg-accent' };
}

function translateSupabaseError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('unique'))
    return 'Este e-mail já está em uso. Tente entrar ou use outro e-mail.';
  if (lower.includes('password'))
    return 'Senha inválida. Verifique os requisitos.';
  return 'Não foi possível criar sua conta agora. Tente novamente.';
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string; general?: string }>({});
  const navigate = useNavigate();

  const ruleResults = useMemo(() => PASSWORD_RULES.map(r => ({ ...r, pass: r.test(password) })), [password]);
  const allRulesPass = ruleResults.every(r => r.pass);
  const strength = useMemo(() => getStrength(password), [password]);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFieldErrors({});

    if (!allRulesPass) {
      setFieldErrors({ password: 'A senha não atende todos os requisitos.' });
      return;
    }
    if (!passwordsMatch) {
      setFieldErrors({ confirm: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      setFieldErrors({ general: translateSupabaseError(error.message) });
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Conta criada com sucesso!</h1>
          <p className="text-muted-foreground text-sm">
            Verifique seu e-mail para confirmar o cadastro. Você será redirecionado em instantes…
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Ir para login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">MenuGest</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="text-muted-foreground mt-1 text-sm">Comece a montar seu cardápio digital</p>

        {fieldErrors.general && (
          <p className="mt-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{fieldErrors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="João Silva" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1.5" />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Crie uma senha segura"
                required
                className={`pr-10 ${submitted && !allRulesPass ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <Progress value={strength.value} className={`h-1.5 [&>div]:${strength.color}`} />
                <p className={`text-xs font-medium ${strength.value <= 40 ? 'text-destructive' : strength.value <= 60 ? 'text-warning' : 'text-accent'}`}>
                  {strength.label}
                </p>
              </div>
            )}

            {/* Checklist */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {ruleResults.map(r => (
                  <li key={r.key} className={`flex items-center gap-1.5 text-xs ${r.pass ? 'text-accent' : 'text-muted-foreground'}`}>
                    {r.pass ? <Check size={12} /> : <X size={12} />}
                    {r.label}
                  </li>
                ))}
              </ul>
            )}

            {submitted && fieldErrors.password && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative mt-1.5">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                className={`pr-10 ${submitted && !passwordsMatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-destructive">As senhas não coincidem.</p>
            )}
            {submitted && fieldErrors.confirm && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.confirm}</p>
            )}
          </div>

          <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" size="lg" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
