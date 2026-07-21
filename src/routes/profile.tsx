import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { authStore, useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, LogOut, MapPin, Bell, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Profile
        </p>
        <h1 className="mt-1 font-display text-3xl">
          {auth.phone || auth.email ? auth.name : "Guest"}
        </h1>
        {auth.phone ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">{auth.phone}</p>
        ) : auth.email ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">{auth.email}</p>
        ) : (
          <Link
            to="/auth"
            search={{ redirect: undefined }}
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        )}
      </div>

      <ul className="mx-5 mt-6 overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.04]">
        <Row icon={<MapPin className="h-4 w-4" />} label="Saved addresses" to="/addresses" />
        <Row icon={<Bell className="h-4 w-4" />} label="Notifications" to="/notifications" />
        <Row icon={<HelpCircle className="h-4 w-4" />} label="Help & support" to="/help" />
      </ul>

      {(auth.phone || auth.email) && (
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            authStore.signOut();
            navigate({ to: "/", search: { category: undefined, q: undefined } });
          }}
          className="mx-5 mt-6 inline-flex items-center gap-2 text-sm text-destructive hover:underline"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      )}

      <p className="mt-10 px-5 pb-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        · Local Shore v0.1 ·
      </p>
    </AppShell>
  );
}

function Row({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <li className="border-b hairline last:border-0">
      <Link to={to} className="flex items-center gap-3 p-4 text-sm hover:bg-muted/40">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </li>
  );
}
