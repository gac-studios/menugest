import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Tenant, TenantUser } from '@/lib/types';

interface UseTenantResult {
  tenant: Tenant | null;
  tenantUser: TenantUser | null;
  loading: boolean;
  hasTenant: boolean;
  refetch: () => Promise<void>;
}

export function useTenant(): UseTenantResult {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    if (!user) {
      setTenant(null);
      setTenantUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data: tu, error } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (tu) {
        setTenantUser(tu);
        const { data: t } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tu.tenant_id)
          .maybeSingle();
        setTenant(t);
      } else {
        setTenantUser(null);
        setTenant(null);
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
      setTenantUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [user]);

  return {
    tenant,
    tenantUser,
    loading,
    hasTenant: !!tenantUser,
    refetch: fetchTenant,
  };
}
