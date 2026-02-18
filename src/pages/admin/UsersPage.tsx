import { Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie quem tem acesso ao painel</p>
        </div>
        <Button className="gradient-primary text-primary-foreground border-0 gap-1.5">
          <Users size={16} /> Convidar Usuário
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card">
        <div className="flex items-center gap-4 p-4 border-b border-border last:border-0">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">J</div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">João Silva</p>
            <p className="text-xs text-muted-foreground">joao@email.com</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
            <Crown size={12} /> Owner
          </span>
        </div>
      </div>
    </div>
  );
}
