import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UseAppAdminResult {
  isAppAdmin: boolean;
  loading: boolean;
}

export function useAppAdmin(): UseAppAdminResult {
  const { user } = useAuth();
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAppAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        // Try RPC first; fall back to direct table check
        const { data, error } = await supabase.rpc('is_app_admin');
        if (!error) {
          setIsAppAdmin(!!data);
        } else {
          // Fallback: query public.app_admins
          const { data: row } = await supabase
            .from('app_admins')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          setIsAppAdmin(!!row);
        }
      } catch {
        setIsAppAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user]);

  return { isAppAdmin, loading };
}
