import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie as configurações do seu negócio</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Nome do estabelecimento</Label>
              <Input placeholder="Burger House" className="mt-1.5" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input placeholder="burger-house" className="mt-1.5" disabled />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva seu negócio..." className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input placeholder="Rua..." className="mt-1.5" />
            </div>
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Número do WhatsApp</Label>
              <Input placeholder="(34) 99999-9999" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Este número receberá os pedidos dos clientes</p>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Logo</Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
              </div>
            </div>
            <div>
              <Label>Imagem de capa</Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
              </div>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>

        <TabsContent value="hours" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-foreground">{day}</span>
                <Input type="time" defaultValue="11:00" className="w-28" />
                <span className="text-muted-foreground">às</span>
                <Input type="time" defaultValue="23:00" className="w-28" />
              </div>
            ))}
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
