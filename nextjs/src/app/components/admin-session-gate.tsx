"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function AdminSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || user.email?.toLowerCase() !== "cyrrenza@outlook.com") {
          router.replace("/login");
          return;
        }

        const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError || assurance?.currentLevel !== "aal2") {
          router.replace("/login");
          return;
        }

        const { data: admin, error: adminError } = await supabase
          .from("ceo_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .maybeSingle();

        if (adminError || !admin) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        router.replace("/login");
      }
    }

    void checkAccess();
    return () => { cancelled = true; };
  }, [router]);

  if (!ready) {
    return <main className="auth-welcome-shell"><section className="auth-login-card" aria-live="polite"><div className="brand-lockup"><span className="brand-name">Crypto<span>Invest</span></span></div><h1>Checking secure access</h1><p className="auth-welcome-copy">Verifying CEO authorization and authenticator assurance before loading the workspace.</p></section></main>;
  }

  return <>{children}</>;
}
