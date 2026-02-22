import { CartItem } from './types';

const MENUGEST_WHATSAPP = '5534932466279';

export function generateOrderNumber(): string {
  const now = Date.now();
  return String(now).slice(-4);
}

export function buildOrderMessage(
  storeName: string,
  items: CartItem[],
  customerName?: string,
  orderType?: 'retirada' | 'entrega',
  address?: string,
  generalNote?: string,
  customerPhone?: string,
  paymentMethod?: string
): string {
  const orderNum = generateOrderNumber();
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const lines: string[] = [];
  lines.push(`🛒 *NOVO PEDIDO - ${storeName}*`);
  lines.push(`📌 *Pedido #${orderNum}*`);
  lines.push('');

  if (customerPhone) lines.push(`📞 *Telefone:* ${customerPhone}`);
  if (customerName) lines.push(`👤 *Cliente:* ${customerName}`);
  if (orderType) lines.push(`📦 *Tipo:* ${orderType === 'retirada' ? 'Retirada no local' : 'Entrega'}`);
  if (address) lines.push(`📍 *Endereço:* ${address}`);

  lines.push('');
  lines.push('🧾 *ITENS:*');

  let total = 0;
  items.forEach((ci) => {
    const subtotal = ci.item.price * ci.quantity;
    total += subtotal;
    lines.push(`• ${ci.quantity}x ${ci.item.name} — ${fmt(subtotal)}`);
    if (ci.observation) lines.push(`  _Obs: ${ci.observation}_`);
  });

  lines.push('');
  lines.push(`💰 *Total: ${fmt(total)}*`);

  if (paymentMethod) {
    lines.push(`💳 *Pagamento:* ${paymentMethod}`);
  }

  if (generalNote) {
    lines.push('');
    lines.push(`📝 *Observação:* ${generalNote}`);
  }

  return lines.join('\n');
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export function buildContractMessage(
  companyName: string,
  slug: string,
  email: string
): string {
  return `Olá, quero contratar o Plano Pro do MenuGest.\n\nEmpresa: ${companyName}\nSlug: ${slug}\nEmail: ${email}\nPlano escolhido: Pro (R$ 99,90/mês)`;
}

export function openContractWhatsApp(companyName: string, slug: string, email: string) {
  const msg = buildContractMessage(companyName, slug, email);
  openWhatsApp(MENUGEST_WHATSAPP, msg);
}

export { MENUGEST_WHATSAPP };
