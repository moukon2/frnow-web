"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  loggedIn: boolean;
  plan?: "public" | "pro" | "advance";
  user?: {
    id?: string;
    plan?: string;
  };
};

export default function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ loggedIn: false, plan: "public" }));
  }, []);

  const loggedIn = me?.loggedIn ?? false;
  const plan = me?.plan || "public";

  const rankingHref =
    plan === "pro" || plan === "advance" ? "/app/ranking" : "/ranking";

  const advHref = plan === "advance" ? "/app/adv" : "/adv";

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-wide">
          FRNow
        </Link>

        <nav className="flex items-center gap-6 text-sm text-white/70">
          <Link href={rankingHref} className="hover:text-white transition">
            Ranking
          </Link>

          <Link href={advHref} className="hover:text-white transition">
            ADV
          </Link>

          <Link href="/pricing" className="hover:text-white transition">
            Pricing
          </Link>

          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>

          {loggedIn && (
            <Link href="/app/integrations" className="hover:text-white transition">
              Integrations
            </Link>
          )}

          {!loggedIn && (
            <Link
              href="/login"
              className="rounded-xl border border-cyan-400/30 px-4 py-1.5 text-cyan-300 hover:bg-cyan-400/10 transition"
            >
              Login
            </Link>
          )}

          {loggedIn && plan === "public" && (
            <Link
              href="/pricing"
              className="rounded-xl border border-cyan-400/30 px-4 py-1.5 text-cyan-300 hover:bg-cyan-400/10 transition"
            >
              Upgrade
            </Link>
          )}

          {loggedIn && (
            <>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/60">
                {plan === "advance" ? "Advance" : plan === "pro" ? "Pro" : "Public"}
              </span>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-white/60 hover:text-white transition disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
