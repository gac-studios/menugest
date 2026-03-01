import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export interface PublicTenantData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  cover_url?: string | null;
  phone_whatsapp?: string | null;
  plan?: string | null;
  is_active: boolean;
  description?: string | null;
  address?: string | null;
  theme_primary_color?: string | null;
  theme_button_plus_color?: string | null;
  theme_header_color?: string | null;
  theme_background_color?: string | null;
  theme_bg_color?: string | null;
  theme_font?: string | null;
  card_background_color?: string | null;
  price_color?: string | null;
  button_color?: string | null;
}

interface PublicTenantContextValue {
  tenant: PublicTenantData | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
}

const PublicTenantContext = createContext<PublicTenantContextValue>({
  tenant: null,
  loading: true,
  notFound: false,
  error: null,
});

export function usePublicTenant() {
  return useContext(PublicTenantContext);
}

export function PublicTenantProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<PublicTenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    localStorage.setItem('last_menu_slug', slug);

    supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          console.error('[PublicTenant] Fetch error:', err);
          setError('Erro ao carregar dados do restaurante.');
          setLoading(false);
          return;
        }
        if (!data || !data.is_active) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setTenant(data as PublicTenantData);
        setLoading(false);
      });
  }, [slug]);

  return (
    <PublicTenantContext.Provider value={{ tenant, loading, notFound, error }}>
      {children}
    </PublicTenantContext.Provider>
  );
}
