import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import PageLoading from "@/components/ui/PageLoading";
import { createClient } from "@/lib/supabase/client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) {
        return;
      }

      if (!data.user) {
        navigate("/login", { replace: true });
        return;
      }

      setAllowed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!allowed) {
    return <PageLoading label="جاري التحقق من تسجيل الدخول..." />;
  }

  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) {
        return;
      }

      if (data.user) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setAllowed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!allowed) {
    return <PageLoading label="جاري التحميل..." />;
  }

  return children;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: isAdmin } = await supabase.rpc("is_admin");

      if (cancelled) {
        return;
      }

      if (!isAdmin) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setAllowed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!allowed) {
    return <PageLoading label="جاري التحقق من الصلاحية..." />;
  }

  return children;
}
