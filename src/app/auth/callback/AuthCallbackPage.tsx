import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoading from "@/components/ui/PageLoading";
import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath } from "@/lib/supabase/site-url";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const next = getSafeNextPath(params.get("next"));

    if (!code) {
      navigate("/login?error=auth_callback_failed", { replace: true });
      return;
    }

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      navigate(error ? "/login?error=auth_callback_failed" : next, { replace: true });
    });
  }, [navigate]);

  return <PageLoading label="جاري إكمال تسجيل الدخول..." />;
}
