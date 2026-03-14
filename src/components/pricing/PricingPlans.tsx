"use client";

import { useState } from "react";

type Plan = "pro" | "advance";

export default function PricingPlans() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: Plan) {
    try {
      setLoadingPlan(plan);
      setError("");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          // 開発中の仮値
          userId: "dev-user",
          email: "dev@frnow.io",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "checkout_create_failed");
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      setError("決済ページの作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
          Pro
        </div>

        <h2 className="mt-3 text-3xl font-bold text-white">FR Ranking</h2>

        <p className="mt-4 text-white/70">
          FRランキングの会員向けフル機能を利用できます。
          全銘柄表示、取引所フィルター、会員向けランキング画面にアクセスできます。
        </p>

        <div className="mt-6 space-y-2 text-sm text-white/60">
          <div>・FRランキング全表示</div>
          <div>・複数取引所フィルター</div>
          <div>・/app/ranking アクセス</div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => startCheckout("pro")}
            disabled={loadingPlan !== null}
            className="inline-flex items-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPlan === "pro" ? "Loading..." : "Subscribe Pro"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
          Advance
        </div>

        <h2 className="mt-3 text-3xl font-bold text-white">FRNow Full Access</h2>

        <p className="mt-4 text-white/70">
          FRNow の全コンテンツを利用できます。
          Pro機能に加えて、ADVリアルタイムトレード一覧や Advance 限定画面も利用できます。
        </p>

        <div className="mt-6 space-y-2 text-sm text-white/60">
          <div>・Pro の全機能</div>
          <div>・ADV リアルタイムトレード一覧</div>
          <div>・/app/adv アクセス</div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => startCheckout("advance")}
            disabled={loadingPlan !== null}
            className="inline-flex items-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPlan === "advance" ? "Loading..." : "Subscribe Advance"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="lg:col-span-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}