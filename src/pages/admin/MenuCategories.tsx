import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

// Mock data
const mockCategories: Category[] = [
  { id: '1', name: 'Hambúrgueres', description: 'Nossos deliciosos burgers artesanais', sort_order: 1, is_active: true },
  { id: '2', name: 'Acompanhamentos', description: 'Batatas, onion rings e mais', sort_order: 2, is_active: true },
  { id: '3', name: 'Bebidas', description: 'Refrigerantes, sucos e shakes', sort_order: 3, is_active: true },
  { id: '4', name: 'Sobremesas', description: 'Para adoçar seu dia', sort_order: 4, is_active: true },
];

export default function MenuCategories() {
  const [categories] = useState<Category[]>(mockCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground text-sm">Organize seu cardápio por categorias</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground border-0 gap-1.5">
              <Plus size={16} /> Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ex: Hambúrgueres" className="mt-1.5" />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Breve descrição" className="mt-1.5" />
              </div>
              <Button className="w-full gradient-primary text-primary-foreground border-0" onClick={() => setDialogOpen(false)}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 shadow-card">
            <GripVertical size={16} className="text-muted-foreground cursor-grab" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
              {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
