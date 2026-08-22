"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function resolveAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin");

      if (!cancelled && !rpcError) {
        setIsAdmin(Boolean(rpcData));
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setIsAdmin(Boolean(profile?.is_admin));
        setLoading(false);
      }
    }

    void resolveAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void resolveAdmin();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}
