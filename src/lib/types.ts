export type PlanType = 'basic' | 'pro';
export type UserRole = 'owner' | 'staff';
export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  subscription_status?: string;
  is_active: boolean;
  phone_whatsapp: string;
  logo_url?: string;
  cover_url?: string;
  address?: string;
  description?: string;
  hide_unavailable: boolean;
  business_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
}

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  is_available: boolean;
  is_promotion: boolean;
  promotion_label?: string;
  sort_order: number;
}

export interface Promotion {
  id: string;
  tenant_id: string;
  menu_item_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  discount_percent?: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  observation?: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  name: string;
  unit: string;
  quantity: number;
  min_stock: number;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  amount: number;
  payment_method: PaymentMethod;
  description?: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  tenant_id: string;
  supplier_id: string;
  total: number;
  created_at: string;
}
