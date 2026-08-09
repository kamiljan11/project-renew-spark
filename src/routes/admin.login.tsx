import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        // Try to claim first-admin role (works only if no admin exists yet)
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session?.user) {
          await supabase.from("user_roles").insert({
            user_id: sess.session.user.id,
            role: "admin",
          } as never);
        }
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-border p-7 shadow-lg"
      >
        <h1 className="text-2xl font-black text-navy mb-1" style={{ fontFamily: "Exo 2" }}>
          Admin {mode === "signup" ? "sign up" : "sign in"}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          {mode === "signup" ? "Create the first admin account." : "Access the requests dashboard."}
        </p>

        <label className="block text-xs font-bold text-navy mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2 mb-3 outline-none focus:border-mas-orange text-sm"
        />

        <label className="block text-xs font-bold text-navy mb-1">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-2 border-border rounded-lg px-3 py-2 mb-4 outline-none focus:border-mas-orange text-sm"
        />

        {msg && <p className="text-xs text-red-600 mb-3">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-mas-orange text-white font-bold py-2.5 rounded-lg disabled:opacity-60"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs text-muted-foreground mt-3 underline"
        >
          {mode === "signin"
            ? "First time? Create the admin account"
            : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="block text-center text-xs text-muted-foreground mt-4">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
