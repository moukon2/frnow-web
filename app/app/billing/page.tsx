"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlanGateCard from "@/components/access/PlanGateCard";

const PORTAL_ENDPOINT = "/api/billing/portal";

type ViewState = "loading" | "ready" | "unauthenticated" | "error";

type MeResponse = {
  id?: string;
  email?: string | null;
  plan?: string | null;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  error?: string;
  message?: string;
};

function normalizePlan(plan: string | null | undefined): "public" | "pro" | "advance" | "unknown" {
  const p = String(plan || "").trim().toLowerCase();
  if (p === "public" || p === "free") return "public";
  if (p === "pro") return "pro";
  if (p === "advance" || p === "adv") return "advance";
  return "unknown";
}

function planLabel(plan: string | null | undefined): string {
  const p = normalizePlan(plan);
  if (p === "public") return "Free";
  if (p === "pro") return "Pro";
  if (p === "advance") return "Advance";
  return "--";
}

function billingLabel(status: string | null | undefined): string {
  const s = String(status || "").trim().toLowerCase();
  if (!s) return "--";
  if (s === "active") return "Active";
  if (s === "trialing") return "Trialing";
  if (s === "past_due") return "Past Due";
  if (s === "canceled") return "Canceled";
  if (s === "unpaid") return "Unpaid";
  if (s === "incomplete") return "Incomplete";
  if (s === "incomplete_expired") return "Incomplete Expired";
  return s;
}

function formatPeriodEnd(ms: number | null | undefined): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function statusTone(status: string | null | undefined): string {
  const s = String(status || "").trim().toLowerCase();
  if (s === "active" || s === "trialing") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (s === "past_due" || s === "unpaid" || s === "incomplete" || s === "canceled") {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }
  return "border-white/10 bg-white/5 text-white/70";
}

function planTone(plan: string | null | undefined): string {
  const p = normalizePlan(plan);
  if (p === "advance") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  if (p === "pro") return "border-white/10 bg-white/5 text-white";
  if (p === "public") return "border-white/10 bg-white/5 text-white/70";
  return "border-white/10 bg-white/5 text-white/70";
}

function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "cyan";
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        tone === "cyan"
          ? "border-cyan-400/20 bg-cyan-400/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className={tone === "cyan" ? "text-sm text-cyan-200" : "text-sm text-white/55"}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-2 text-xs text-white/40">{sub}</div> : null}
    </div>
  );
}

export default function BillingPage() {
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [error, setError] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [me, setMe] = useState<MeResponse>({});

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError("");
        setViewState("loading");

        const res = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        let json: MeResponse = {};
        try {
          json = await res.json();
        } catch {
          json = {};
        }

        if (!alive) return;

        if (res.status === 401) {
          setViewState("unauthenticated");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || json.message || `HTTP ${res.status}`);
        }

        setMe(json);
        setViewState("ready");
      } catch (e) {
        console.error("BILLING_PAGE_LOAD_FAIL", e);
        if (!alive) return;
        setError("Billing 情報の取得に失敗しました。");
        setViewState("error");
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  async function openPortal() {
    try {
      setPortalBusy(true);
      setError("");

      const res = await fetch(PORTAL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      if (!data?.url || typeof data.url !== "string") {
        throw new Error("portal url not returned");
      }

      window.location.href = data.url;
    } catch (e) {
      console.error("BILLING_PORTAL_OPEN_FAIL", e);
      setError("Customer Portal を開けませんでした。");
    } finally {
      setPortalBusy(false);
    }
  }

  const plan = normalizePlan(me.plan);
  const planText = useMemo(() => planLabel(me.plan), [me.plan]);
  const billingText = useMemo(() => billingLabel(me.billing_status), [me.billing_status]);
  const periodEndText = useMemo(
    () => formatPeriodEnd(me.current_period_end_ms),
    [me.current_period_end_ms],
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-cyan-400/[0.05] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Account Billing
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Billing & Subscription
            </h1>
            <p className="mt-4 text-white/70">
              現在のプラン、課金状態、更新期限を確認できます。支払い方法変更、解約、
              請求履歴確認は Customer Portal から行います。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Pricingを見る
            </Link>
            <button
              type="button"
              onClick={openPortal}
              disabled={portalBusy || viewState !== "ready" || plan === "public" || plan === "unknown"}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {portalBusy ? "Opening..." : "Customer Portal を開く"}
            </button>
          </div>
        </div>
      </div>

      {viewState === "loading" && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          読み込み中...
        </div>
      )}

      {viewState === "unauthenticated" && (
        <div className="mt-8">
          <PlanGateCard
            variant="login"
            planName="Account"
            publicHref="/pricing"
            loginHref="/login?next=/app/billing"
          />
        </div>
      )}

      {viewState === "error" && (
        <div className="mt-8 space-y-4">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
          <PlanGateCard
            variant="error"
            planName="Account"
            publicHref="/pricing"
            loginHref="/login?next=/app/billing"
          />
        </div>
      )}

      {viewState === "ready" && (
        <>
          {error ? (
            <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Current Plan"
              value={planText}
              sub={plan === "advance" ? "ADV access enabled" : plan === "pro" ? "Pro access enabled" : "Public access"}
              tone={plan === "advance" ? "cyan" : "default"}
            />
            <StatCard
              label="Billing Status"
              value={billingText}
              sub="billing subscription status"
            />
            <StatCard
              label="Current Period End"
              value={periodEndText}
              sub="Asia/Tokyo"
            />
            <StatCard
              label="Email"
              value={me.email || "--"}
              sub="account email"
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                Subscription Summary
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className={`rounded-full px-3 py-1.5 text-sm ${planTone(me.plan)}`}>
                  Plan: {planText}
                </span>
                <span className={`rounded-full px-3 py-1.5 text-sm ${statusTone(me.billing_status)}`}>
                  Status: {billingText}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/35">
                    customer
                  </div>
                  <div className="mt-2 break-all text-sm text-white/75">
                    {me.stripe_customer_id || "--"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/35">
                    Subscription
                  </div>
                  <div className="mt-2 break-all text-sm text-white/75">
                    {me.stripe_subscription_id || "--"}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/65">
                Customer Portal では、支払い方法変更、請求履歴確認、解約を行えます。
                Free プランでは portal を開く必要がないため、ボタンは無効化されます。
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                Quick Actions
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={portalBusy || plan === "public" || plan === "unknown"}
                  className="flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {portalBusy ? "Opening..." : "Customer Portal を開く"}
                </button>

                <Link
                  href="/pricing"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  プランを見直す
                </Link>

                <Link
                  href={plan === "advance" ? "/app/adv" : "/app/ranking"}
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  {plan === "advance" ? "ADV Dashboard へ" : "会員ページへ"}
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/35">
                  Current access
                </div>
                <div className="mt-3 text-sm leading-6 text-white/70">
                  {plan === "advance" &&
                    "Advance 会員です。ADV signals と /app/adv の performance dashboard を利用できます。"}
                  {plan === "pro" &&
                    "Pro 会員です。会員向け ranking と spread ranking を利用できます。"}
                  {plan === "public" &&
                    "現在は Free / Public アクセスです。会員機能を使うには Pro または Advance へアップグレードしてください。"}
                  {plan === "unknown" &&
                    "現在のプラン状態を判定できませんでした。必要に応じて pricing からプランをご確認ください。"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
            billing_status と current_period_end_ms は subscriptionの状態に応じて反映されます。
          </div>
        </>
      )}
    </main>
  );
}