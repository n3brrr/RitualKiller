import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/i18n";
import Loading from "@/components/animations/Loading";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      navigate(data.session ? "/app/dashboard" : "/login", { replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual-black">
      <Loading label={t("auth.verifying")} />
    </main>
  );
}
