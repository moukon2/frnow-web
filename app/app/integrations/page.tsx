"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PlanGateCard from "@/components/access/PlanGateCard";

type Plan = "public" | "pro" | "advance";
type ViewState = "checking" | "ready" | "unauthenticated" | "error";

type MeResponse = {
  loggedIn?: boolean;
  plan?: string | null;
  billing_status?: string | null;
  error?: string;
  message?: string;
};

function normalizePlan(plan: unknown): Plan {
  const p = String(plan || "").trim().toLowerCase();
  if (p === "advance" || p === "adv") return "advance";
  if (p === "pro") return "pro";
  return "public";
}

function statusBadge(plan: Plan) {
  if (plan === "advance") {
    return "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (plan === "pro") {
    return "border border-white/10 bg-white/5 text-white/80";
  }
  return "border border-white/10 bg-white/5 text-white/60";
}

function IntegrationCard({
  title,
  badge,
  description,
  steps,
}: {
  title: string;
  badge: string;
  description: string;
  steps: string[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-white/60">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
          {badge}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Current State</div>
        <div className="mt-2 text-sm text-white/75">接続UIの土台まで実装済み。実接続APIの差し込み待ちです。</div>
      </div>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Planned Flow</div>
        <ul className="mt-3 space-y-3 text-sm text-white/75">
          {steps.map((step) => (
            <li key={step} className="flex items-start gap-3">
              <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function IntegrationsPage() {
  const [viewState, setViewState] = useState<ViewState>("checking");
  const [plan, setPlan] = useState<Plan>("public");
  const [billingStatus, setBillingStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const json: MeResponse = await res.json().catch(() => ({}));

        if (res.status === 401 || json.loggedIn === false) {
          setPlan("public");
          setViewState("unauthenticated");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || json.message || `HTTP ${res.status}`);
        }

        setPlan(normalizePlan(json.plan));
        setBillingStatus(String(json.billing_status || ""));
        setViewState("ready");
      } catch (error) {
        console.error("INTEGRATIONS_PAGE_LOAD_FAIL", error);
        setViewState("error");
      }
    }

    load();
  }, []);

  if (viewState === "checking") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            読み込み中...
          </div>
        </div>
      </main>
    );
  }

  if (viewState === "unauthenticated") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <PlanGateCard
            variant="login"
            planName="Account"
            title="Integrations を使うにはログインが必要です"
            description="ログイン後に Telegram / Discord の接続状況や今後の通知設定UIを確認できます。"
            pricingHref="/pricing"
          />
        </div>
      </main>
    );
  }

  if (viewState === "error") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <PlanGateCard
            variant="error"
            planName="Account"
            title="Integrations 情報の取得に失敗しました"
            description="時間をおいて再度お試しください。解消しない場合は Billing ページや Pricing を確認してください。"
            pricingHref="/pricing"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
              Account Integrations
            </div>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Telegram / Discord</h1>
            <p className="mt-1 text-sm text-white/55">
              通知連携UIの土台ページ。接続状態表示と将来の設定導線をここに集約します。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/app/billing" className="btn-secondary-soft">
              Billing
            </Link>
            <Link href="/pricing" className="btn-primary-soft">
              Pricing
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Current Plan</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {plan === "advance" ? "Advance" : plan === "pro" ? "Pro" : "Free"}
            </div>
            <div className="mt-1 text-xs text-white/50">Integrations page access</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Billing Status</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {billingStatus ? billingStatus : "--"}
            </div>
            <div className="mt-1 text-xs text-white/50">/api/me ベース</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Scope</div>
            <div className="mt-2 text-2xl font-semibold text-white">UI Ready</div>
            <div className="mt-1 text-xs text-white/50">connection API は後差し込み</div>
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusBadge(plan)}`}>
              {plan === "advance" ? "Advance" : plan === "pro" ? "Pro" : "Public"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
              Telegram / Discord UI
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-white/65">
            今回のページは UI 先行実装です。backend 側の接続トークン発行や callback 処理が揃ったら、ここに接続状態・再連携・通知設定を差し込みます。
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <IntegrationCard
            title="Telegram"
            badge="Bot"
            description="Telegram bot 連携の入口です。接続済みなら chat / user 単位の状態表示、未接続なら認可開始導線をここに置きます。"
            steps={[
              "Connect Telegram ボタンを表示",
              "認可後に chat_id / 接続状態を表示",
              "通知 on/off や alert 種別設定へ導線追加",
            ]}
          />

          <IntegrationCard
            title="Discord"
            badge="Guild / DM"
            description="Discord bot / webhook 連携の入口です。接続済みサーバーや通知先チャンネルの確認画面をここに集約します。"
            steps={[
              "Connect Discord ボタンを表示",
              "接続済み guild / channel 状態を表示",
              "通知先や exchange filter 設定へ導線追加",
            ]}
          />
        </div>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-base font-semibold text-white">Next step</h2>
          <p className="mt-2 text-sm leading-7 text-white/65">
            まずはこのページをナビ導線に乗せ、その後 backend の接続状態 API を追加して実動作に寄せるのが安全です。
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/app/ranking" className="btn-secondary-soft">
              Ranking
            </Link>
            <Link href="/app/adv" className="btn-secondary-soft">
              ADV
            </Link>
            <Link href="/app/billing" className="btn-secondary-soft">
              Billing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
