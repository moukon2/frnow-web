"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Plan = "public" | "pro" | "advance";

type MeResponse = {
  loggedIn?: boolean;
  plan?: string | null;
  email?: string | null;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  user?: {
    id?: string | null;
    email?: string | null;
    plan?: string | null;
    billing_status?: string | null;
    current_period_end_ms?: number | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  };
  error?: string;
  message?: string;
};

function normalizePlan(plan: unknown): Plan {
  const p = String(plan || "").trim().toLowerCase();
  if (p === "advance" || p === "adv") return "advance";
  if (p === "pro") return "pro";
  return "public";
}

function planLabel(plan: Plan) {
  if (plan === "advance") return "Advance";
  if (plan === "pro") return "Pro";
  return "Free";
}

function statusLabel(status: string | null | undefined) {
  const s = String(status || "").trim().toLowerCase();
  if (!s) return "--";
  if (s === "active") return "Active";
  if (s === "canceled") return "Canceled";
  if (s === "revoked") return "Revoked";
  if (s === "inactive") return "Inactive";
  return s;
}

function formatPeriodEnd(ms: number | null | undefined) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function InfoCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/50">{sub}</div> : null}
    </div>
  );
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<MeResponse | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json: MeResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      setData(json);
    } catch (e) {
      console.error("BILLING_PAGE_LOAD_FAIL", e);
      setError("Billing 情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    try {
      setPortalLoading(true);
      setError("");

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      if (!json?.url || typeof json.url !== "string") {
        throw new Error("portal url not returned");
      }

      window.location.href = json.url;
    } catch (e) {
      console.error("BILLING_PORTAL_OPEN_FAIL", e);
      setError("Customer Portal を開けませんでした。");
    } finally {
      setPortalLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const user = data?.user ?? data ?? {};
  const plan = normalizePlan(user.plan ?? data?.plan);
  const billingStatus = String(user.billing_status ?? data?.billing_status ?? "");
  const email = String(user.email ?? data?.email ?? "") || "--";
  const customerId = String(user.stripe_customer_id ?? data?.stripe_customer_id ?? "") || "--";
  const subscriptionId =
    String(user.stripe_subscription_id ?? data?.stripe_subscription_id ?? "") || "--";
  const periodEndMs = Number(user.current_period_end_ms ?? data?.current_period_end_ms ?? 0) || 0;

  const canOpenPortal = plan !== "public";

  const summaryText = useMemo(() => {
    if (plan === "advance") {
      return "Advance 会員です。ADV signals と /app/adv を利用できます。";
    }
    if (plan === "pro") {
      return "Pro 会員です。会員向けランキングと spread ranking を利用できます。";
    }
    return "Free プランです。公開ランキングから試して、必要に応じて上位プランへ進めます。";
  }, [plan]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
              Account Billing
            </div>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
              Billing & Subscription
            </h1>
            <p className="mt-1 text-sm text-white/55">
              現在のプランと課金状態を確認
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-secondary-soft">
              Pricing
            </Link>

            <button
              type="button"
              onClick={openPortal}
              disabled={!canOpenPortal || portalLoading}
              className="btn-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Customer Portal"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            読み込み中...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <InfoCard
                label="Current Plan"
                value={planLabel(plan)}
                sub={plan === "advance" ? "ADV dashboard 利用可" : plan === "pro" ? "会員Ranking 利用可" : "公開版"}
              />
              <InfoCard
                label="Billing Status"
                value={statusLabel(billingStatus)}
                sub="subscription 状態"
              />
              <InfoCard
                label="Period End"
                value={formatPeriodEnd(periodEndMs)}
                sub="Asia/Tokyo"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-white">Subscription Summary</h2>
                  <p className="mt-1 text-xs text-white/45">{summaryText}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                    Plan: {planLabel(plan)}
                  </span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                    Status: {statusLabel(billingStatus)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Email
                    </div>
                    <div className="mt-2 text-sm text-white">{email}</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Period End
                    </div>
                    <div className="mt-2 text-sm text-white">
                      {formatPeriodEnd(periodEndMs)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Customer
                    </div>
                    <div className="mt-2 break-all text-sm text-white">{customerId}</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      Subscription
                    </div>
                    <div className="mt-2 break-all text-sm text-white">{subscriptionId}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-white">Quick Actions</h2>
                  <p className="mt-1 text-xs text-white/45">
                    プラン確認・移動・Portal
                  </p>
                </div>

                <div className="grid gap-3">
                  <Link href="/app/ranking" className="btn-secondary-soft">
                    Rankingを見る
                  </Link>

                  <Link href="/app/adv" className="btn-secondary-soft">
                    ADV Dashboardを見る
                  </Link>

                  <Link href="/pricing" className="btn-secondary-soft">
                    料金プランを見る
                  </Link>

                  <button
                    type="button"
                    onClick={openPortal}
                    disabled={!canOpenPortal || portalLoading}
                    className="btn-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {portalLoading ? "Opening..." : "Customer Portal を開く"}
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}