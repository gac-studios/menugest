import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';

export interface PlanFeatures {
  dashboard: boolean;
  settings: boolean;
  menu: boolean;
  orders_internal: boolean;
  sales: boolean;
  purchases: boolean;
  inventory: boolean;
  financial: boolean;
}

const DEFAULT_FEATURES: Record<string, PlanFeatures> = {
  none: {
    dashboard: true, settings: true, menu: false,
    orders_internal: false, sales: false, purchases: false, inventory: false, financial: false,
  },
  basic: {
    dashboard: true, settings: true, menu: true,
    orders_internal: false, sales: false, purchases: false, inventory: false, financial: false,
  },
  pro: {
    dashboard: true, settings: true, menu: true,
    orders_internal: true, sales: true, purchases: true, inventory: true, financial: true,
  },
};

export function usePlanFeatures() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FEATURES.none);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantLoading) return;

    const plan = tenant?.plan || 'none';

    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('plan_features')
          .select('features')
          .eq('plan', plan)
          .maybeSingle();

        if (error || !data) {
          // Fallback to defaults
          setFeatures(DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none);
        } else {
          // Merge with defaults to ensure all keys exist
          const merged = { ...(DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none), ...data.features };
          setFeatures(merged);
        }
      } catch {
        setFeatures(DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [tenant?.plan, tenantLoading]);

  return { features, loading: tenantLoading || loading };
}

/**
 * Standalone fetch for public pages (checkout) that don't have tenant context via useTenant.
 * Pass the plan string directly.
 */
export async function fetchPlanFeatures(plan: string): Promise<PlanFeatures> {
  try {
    const { data, error } = await supabase
      .from('plan_features')
      .select('features')
      .eq('plan', plan)
      .maybeSingle();

    if (error || !data) return DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none;
    return { ...(DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none), ...data.features };
  } catch {
    return DEFAULT_FEATURES[plan] || DEFAULT_FEATURES.none;
  }
}
