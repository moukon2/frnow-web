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

export default function AppHomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => setMe({ loggedIn: false, plan: "public" }))
      .finally(() => setLoading(false));
  }, []);

  const plan = me?.plan || "public";
  const canUseRanking = plan === "pro" || plan === "advance";
  const canUseAdv = plan === "advance";

  const [billingLoading, setBillingLoading] = useState(false);

  async function openBilling() {
    try {
      setBillingLoading(true);

      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "billing_portal_failed");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Billingページを開けませんでした。");
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
          Members Area
        </div>
        <h1 className="mt-3 text-4xl font-bold text-white">App Dashboard</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          FRNow の会員向けページです。利用中のプランに応じて、
          Ranking と ADV コンテンツへアクセスできます。
        </p>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          読み込み中...
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/60">
              Current Plan
            </span>

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-sm font-semibold text-cyan-200">
              {plan === "advance"
                ? "Advance"
                : plan === "pro"
                ? "Pro"
                : "Public"}
            </span>

            {(plan === "pro" || plan === "advance") && (
              <button
                onClick={openBilling}
                disabled={billingLoading}
                className="rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-60"
              >
                {billingLoading ? "Opening..." : "Billing"}
              </button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                Pro
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white">
                Funding Rate Ranking
              </h2>

              <p className="mt-4 text-white/70">
                複数取引所の Funding Rate ランキングを会員向けに表示します。
                Pro 以上では全銘柄表示と取引所フィルターが利用できます。
              </p>

              <div className="mt-6 space-y-2 text-sm text-white/60">
                <div>・全銘柄表示</div>
                <div>・取引所フィルター</div>
                <div>・会員向けランキング画面</div>
              </div>

              <div className="mt-8">
                {canUseRanking ? (
                  <Link
                    href="/app/ranking"
                    className="inline-flex items-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Open Ranking
                  </Link>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center rounded-2xl border border-cyan-400/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      Upgrade to Pro
                    </Link>

                    <Link
                      href="/ranking"
                      className="inline-flex items-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      公開版を見る
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                Advance
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white">
                ADV Realtime Trades
              </h2>

              <p className="mt-4 text-white/70">
                FRNow の Advance 向けリアルタイムトレード一覧です。
                直近のクローズ済みトレードや詳細な ADV コンテンツを確認できます。
              </p>

              <div className="mt-6 space-y-2 text-sm text-white/60">
                <div>・リアルタイムトレード一覧</div>
                <div>・Advance限定コンテンツ</div>
                <div>・会員向けADV画面</div>
              </div>

              <div className="mt-8">
                {canUseAdv ? (
                  <Link
                    href="/app/adv"
                    className="inline-flex items-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Open ADV
                  </Link>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center rounded-2xl border border-cyan-400/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      Upgrade to Advance
                    </Link>

                    <Link
                      href="/adv"
                      className="inline-flex items-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      公開版を見る
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}