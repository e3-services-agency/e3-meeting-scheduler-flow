import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useAdminCheck = (user: User | null) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdminRole = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Failed to check user permissions');
          setIsAdmin(false);
          return;
        }

        const userIsAdmin = profile?.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Log for debugging
        console.log(`User ${user.email} admin status:`, userIsAdmin);
      } catch (err) {
        console.error('Admin check error:', err);
        setError('Failed to verify admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading, error };
};