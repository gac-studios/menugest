import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, ChefHat, Truck, CheckCircle2, XCircle, Eye, RefreshCw } from 'lucide-react';

type OrderStatus = 'new' | 'preparing' | 'out_for_delivery' | 'done' | 'canceled';

interface Order {
  id: string;
  tenant_id: string;
  total: number;
  payment_method: string;
  description?: string | null;
  status: OrderStatus;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  notes?: string | null;
  sold_at?: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  menu_item_name?: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Novo', color: 'bg-blue-500/15 text-blue-700 border-blue-200', icon: <ClipboardList size={14} /> },
  preparing: { label: 'Em preparo', color: 'bg-amber-500/15 text-amber-700 border-amber-200', icon: <ChefHat size={14} /> },
  out_for_delivery: { label: 'Saiu p/ entrega', color: 'bg-purple-500/15 text-purple-700 border-purple-200', icon: <Truck size={14} /> },
  done: { label: 'Finalizado', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
  canceled: { label: 'Cancelado', color: 'bg-red-500/15 text-red-700 border-red-200', icon: <XCircle size={14} /> },
};

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
};

const statusFilters: OrderStatus[] = ['new', 'preparing', 'out_for_delivery', 'done', 'canceled'];

export default function OrdersPage() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    if (!tenant) return;
    setLoading(true);
    let query = supabase
      .from('sales')
      .select('*')
      .eq('tenant_id', tenant.id)
      .not('status', 'is', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (activeFilter !== 'all') {
      query = query.eq('status', activeFilter);
    }

    const { data, error } = await query;
    if (error) console.error('Error fetching orders:', error);
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [tenant, activeFilter]);

  const openDetail = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data, error } = await supabase
      .from('sale_items')
      .select('id, menu_item_id, qty, unit_price, subtotal')
      .eq('sale_id', order.id);

    if (error) {
      console.error('Error fetching items:', error);
      setOrderItems([]);
    } else {
      // Fetch item names
      const itemIds = (data || []).map(i => i.menu_item_id);
      let namesMap: Record<string, string> = {};
      if (itemIds.length > 0) {
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('id, name')
          .in('id', itemIds);
        namesMap = (menuData || []).reduce((acc, m) => ({ ...acc, [m.id]: m.name }), {} as Record<string, string>);
      }
      setOrderItems((data || []).map(i => ({ ...i, menu_item_name: namesMap[i.menu_item_id] || 'Item removido' })));
    }
    setLoadingItems(false);
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('sales')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Pedido ${statusConfig[newStatus].label.toLowerCase()}!` });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchOrders();
    }
    setUpdatingStatus(false);
  };

  const getNextActions = (status: OrderStatus): { label: string; next: OrderStatus; variant: 'default' | 'destructive' }[] => {
    switch (status) {
      case 'new':
        return [
          { label: 'Iniciar preparo', next: 'preparing', variant: 'default' },
          { label: 'Cancelar', next: 'canceled', variant: 'destructive' },
        ];
      case 'preparing':
        return [
          { label: 'Saiu p/ entrega', next: 'out_for_delivery', variant: 'default' },
          { label: 'Cancelar', next: 'canceled', variant: 'destructive' },
        ];
      case 'out_for_delivery':
        return [
          { label: 'Finalizar', next: 'done', variant: 'default' },
          { label: 'Cancelar', next: 'canceled', variant: 'destructive' },
        ];
      default:
        return [];
    }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const shortId = (id: string) => '#' + id.slice(0, 6).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground text-sm">Acompanhe e gerencie os pedidos recebidos</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw size={14} /> Atualizar
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            activeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          Todos
        </button>
        {statusFilters.map(s => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              activeFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            {statusConfig[s].icon}
            {statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Nenhum pedido encontrado</p>
          <p className="text-sm mt-1">Os pedidos recebidos pelo cardápio aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map(order => {
            const sc = statusConfig[order.status] || statusConfig.new;
            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border/50 shadow-card p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => openDetail(order)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{shortId(order.id)}</span>
                    <Badge className={`${sc.color} border text-xs flex items-center gap-1`}>
                      {sc.icon} {sc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{formatDate(order.sold_at || order.created_at)}</span>
                    {order.customer_name && <span>• {order.customer_name}</span>}
                    <span>• {paymentLabels[order.payment_method] || order.payment_method}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">{fmt(Number(order.total))}</p>
                  <button className="text-xs text-primary flex items-center gap-1 mt-1">
                    <Eye size={12} /> Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={open => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pedido {shortId(selectedOrder.id)}
                  <Badge className={`${statusConfig[selectedOrder.status]?.color} border text-xs flex items-center gap-1`}>
                    {statusConfig[selectedOrder.status]?.icon} {statusConfig[selectedOrder.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Customer info */}
                <div className="space-y-1.5 text-sm">
                  <p className="text-muted-foreground text-xs">
                    {formatDate(selectedOrder.sold_at || selectedOrder.created_at)}
                  </p>
                  {selectedOrder.customer_name && (
                    <p><span className="font-medium text-foreground">👤 Cliente:</span> {selectedOrder.customer_name}</p>
                  )}
                  {selectedOrder.customer_phone && (
                    <p><span className="font-medium text-foreground">📞 Telefone:</span> {selectedOrder.customer_phone}</p>
                  )}
                  {selectedOrder.delivery_address && (
                    <p><span className="font-medium text-foreground">📍 Endereço:</span> {selectedOrder.delivery_address}</p>
                  )}
                  <p><span className="font-medium text-foreground">💳 Pagamento:</span> {paymentLabels[selectedOrder.payment_method] || selectedOrder.payment_method}</p>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">🧾 Itens</h3>
                  {loadingItems ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-lg">
                          <span className="text-foreground">
                            {item.qty}x {item.menu_item_name}
                          </span>
                          <span className="font-medium text-foreground">{fmt(Number(item.subtotal))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">📝 Observação</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-lg font-bold text-foreground">Total: {fmt(Number(selectedOrder.total))}</span>
                </div>

                {/* Status actions */}
                {getNextActions(selectedOrder.status).length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {getNextActions(selectedOrder.status).map(action => (
                      <Button
                        key={action.next}
                        variant={action.variant}
                        className="flex-1"
                        disabled={updatingStatus}
                        onClick={() => updateStatus(selectedOrder.id, action.next)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}