"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Plan = "public" | "pro" | "advance";

type MeResponse = {
  loggedIn?: boolean;
  plan?: string | null;
  email?: string | null;
};

function normalizePlan(plan: unknown): Plan {
  const p = String(plan || "").toLowerCase();

  if (p === "advance" || p === "adv") return "advance";
  if (p === "pro") return "pro";

  return "public";
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white"
          : "inline-flex items-center rounded-xl px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
      }
    >
      {children}
    </Link>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "advance") {
    return <span className="badge-plan-adv">ADV</span>;
  }

  if (plan === "pro") {
    return <span className="badge-plan-pro">PRO</span>;
  }

  return <span className="badge-plan-free">FREE</span>;
}

export default function SiteNav() {
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);
  const [plan, setPlan] = useState<Plan>("public");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });

        const json: MeResponse = await res.json().catch(() => ({}));

        if (!mounted) return;

        setLoggedIn(Boolean(json.loggedIn));
        setPlan(normalizePlan(json.plan));
        setEmail(json.email || null);
      } catch {
        if (!mounted) return;

        setLoggedIn(false);
        setPlan("public");
        setEmail(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const rankingHref = useMemo(() => {
    if (loggedIn && (plan === "pro" || plan === "advance")) {
      return "/app/ranking";
    }

    return "/ranking";
  }, [loggedIn, plan]);

  const advHref = useMemo(() => {
    if (loggedIn && plan === "advance") {
      return "/app/adv";
    }

    return "/adv";
  }, [loggedIn, plan]);

  return (
    <nav className="flex items-center gap-1 md:gap-2">

      <NavLink href="/" active={isActive(pathname, "/")}>
        Home
      </NavLink>

      <NavLink href={rankingHref} active={isActive(pathname, rankingHref)}>
        Ranking
      </NavLink>

      <NavLink href={advHref} active={isActive(pathname, advHref)}>
        ADV
      </NavLink>

      <NavLink href="/pricing" active={isActive(pathname, "/pricing")}>
        Pricing
      </NavLink>

      <div className="ml-3 flex items-center gap-2 border-l border-white/10 pl-3">

        {loggedIn ? (
          <>
            <Link href="/app/billing" className="btn-secondary-soft">
              Billing
            </Link>

            <PlanBadge plan={plan} />

            {email && (
              <span className="hidden text-sm text-white/50 md:block">
                {email}
              </span>
            )}

            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                location.href = "/";
              }}
              className="btn-ghost-soft"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="btn-primary-soft">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}