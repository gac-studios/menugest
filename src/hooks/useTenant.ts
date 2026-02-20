import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Tenant, TenantUser } from '@/lib/types';

interface UseTenantResult {
  tenant: Tenant | null;
  tenantUser: TenantUser | null;
  /** True while auth OR tenant data is still loading — never route while this is true */
  loading: boolean;
  hasTenant: boolean;
  hasNoPlan: boolean;
  hasActivePlan: boolean;
  isProEnabled: boolean;
  /** Non-null means a query error occurred (not "no tenant found") */
  fetchError: string | null;
  refetch: () => Promise<void>;
}

export function useTenant(): UseTenantResult {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTenant = useCallback(async () => {
    // Don't start fetching until auth is resolved
    if (authLoading) return;

    if (!user) {
      setTenant(null);
      setTenantUser(null);
      setFetchError(null);
      setTenantLoading(false);
      return;
    }

    setTenantLoading(true);
    setFetchError(null);

    try {
      // Source of truth: tenant_users table (not tenants directly)
      const { data: tu, error: tuError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tuError) {
        // Real query error — do NOT fall through to "no tenant" state
        console.error('[useTenant] Error querying tenant_users:', tuError);
        setFetchError(tuError.message || 'Erro ao verificar dados da conta.');
        setTenantLoading(false);
        return;
      }

      if (tu) {
        // User has a tenant — fetch its details
        setTenantUser(tu);

        const { data: t, error: tError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tu.tenant_id)
          .maybeSingle();

        if (tError) {
          console.error('[useTenant] Error querying tenants:', tError);
          setFetchError(tError.message || 'Erro ao carregar dados da empresa.');
          setTenantLoading(false);
          return;
        }

        setTenant(t);
      } else {
        // Genuine absence: user truly has no tenant yet → show onboarding
        setTenantUser(null);
        setTenant(null);
      }
    } catch (err: any) {
      console.error('[useTenant] Unexpected error:', err);
      setFetchError(err?.message || 'Erro inesperado ao carregar conta.');
    } finally {
      setTenantLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Overall loading = auth still loading OR (auth done but tenant fetch not finished)
  const loading = authLoading || tenantLoading;

  const hasTenant = !!tenantUser;
  const hasNoPlan = !tenant?.plan || tenant.plan === 'none';
  const hasActivePlan = tenant?.subscription_status === 'active' && tenant?.is_active === true;
  const isProEnabled = tenant?.plan === 'pro' && hasActivePlan;

  return {
    tenant,
    tenantUser,
    loading,
    hasTenant,
    hasNoPlan,
    hasActivePlan,
    isProEnabled,
    fetchError,
    refetch: fetchTenant,
  };
}
