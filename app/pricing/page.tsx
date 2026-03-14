"use client";

import Link from "next/link";
import { useState } from "react";

const CHECKOUT_ENDPOINT = "/api/billing/checkout";

const PRICING = {
  pro: {
    priceLabel: "¥1,280",
    periodLabel: "/ month",
  },
  advance: {
    priceLabel: "¥2,980",
    periodLabel: "/ month",
  },
};

const plans = [
  {
    key: "free",
    name: "Free",
    badge: "Public",
    price: "¥0",
    period: "/ month",
    description:
      "まずは公開ランキングを見たい人向け。FRNow の基本機能を試すための入口プランです。",
    ctaHref: "/ranking",
    ctaLabel: "公開ランキングを見る",
    featured: false,
    features: [
      "公開ランキング",
      "基本的な FR 確認",
      "ログイン不要で閲覧可能",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    badge: "Popular",
    price: PRICING.pro.priceLabel,
    period: PRICING.pro.periodLabel,
    description:
      "ランキングをより深く使いたい人向け。複数取引所比較や spread ranking を使いたい場合の標準プランです。",
    checkoutPlan: "pro" as const,
    ctaLabel: "Proを開始",
    featured: false,
    features: [
      "Pro ranking",
      "Spread ranking",
      "会員向けランキング画面 /app/ranking",
      "複数取引所の比較表示",
    ],
  },
  {
    key: "advance",
    name: "Advance",
    badge: "ADV",
    price: PRICING.advance.priceLabel,
    period: PRICING.advance.periodLabel,
    description:
      "FR + OI シグナルと、その outcome を追うための上位プラン。ADV signals と dashboard を使う人向けです。",
    checkoutPlan: "advance" as const,
    ctaLabel: "Advanceを開始",
    featured: true,
    features: [
      "Advance ranking / ADV access",
      "ADV signals",
      "ADV dashboard (/app/adv)",
      "Cumulative return / drawdown",
      "Win rate / PF / outcome log",
    ],
  },
];

const compareRows = [
  { label: "公開ランキング", free: true, pro: true, advance: true },
  { label: "Pro ranking", free: false, pro: true, advance: true },
  { label: "Spread ranking", free: false, pro: true, advance: true },
  { label: "ADV signals", free: false, pro: false, advance: true },
  { label: "ADV dashboard", free: false, pro: false, advance: true },
  { label: "Outcome tracking", free: false, pro: false, advance: true },
  { label: "Cumulative return / drawdown", free: false, pro: false, advance: true },
];

const faqs = [
  {
    q: "FRNow は自動売買ですか？",
    a: "いいえ。FRNow はエントリー / exit の判断材料となるシグナルと、その結果確認のためのツールです。自動売買前提ではありません。",
  },
  {
    q: "Advance の dashboard に表示される数値は実現損益ですか？",
    a: "いいえ。記録済みシグナル結果ベースの指標です。口座連携された実現損益ではありません。",
  },
  {
    q: "どのプランから始めるべきですか？",
    a: "ランキング中心なら Pro、ADV signals と実績ダッシュボードまで使いたいなら Advance がおすすめです。",
  },
  {
    q: "途中で解約等はできますか？",
    a: "はい。Customer Portal から、解約・支払い方法変更・請求履歴確認ができます。",
  },
];

function CheckIcon() {
  return <span className="text-cyan-300">●</span>;
}

function CrossIcon() {
  return <span className="text-white/20">—</span>;
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-sm uppercase tracking-[0.22em] text-cyan-300">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      {desc ? <p className="mt-4 text-white/65">{desc}</p> : null}
    </div>
  );
}

function PlanButton({
  plan,
  label,
  featured,
  loading,
  onCheckout,
}: {
  plan: "pro" | "advance";
  label: string;
  featured: boolean;
  loading: boolean;
  onCheckout: (plan: "pro" | "advance") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckout(plan)}
      disabled={loading}
      className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        featured
          ? "bg-cyan-300 text-black hover:opacity-90"
          : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
      }`}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}

function PlanCard({
  name,
  badge,
  price,
  period,
  description,
  ctaHref,
  ctaLabel,
  checkoutPlan,
  featured,
  features,
  loadingPlan,
  onCheckout,
}: {
  name: string;
  badge: string;
  price: string;
  period: string;
  description: string;
  ctaHref?: string;
  ctaLabel: string;
  checkoutPlan?: "pro" | "advance";
  featured: boolean;
  features: string[];
  loadingPlan: "pro" | "advance" | null;
  onCheckout: (plan: "pro" | "advance") => void;
}) {
  return (
    <div
      className={`rounded-[28px] border p-6 md:p-7 ${
        featured
          ? "border-cyan-400/25 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-white/[0.02] shadow-2xl shadow-cyan-950/20"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
              featured
                ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                : "border border-white/10 bg-white/[0.05] text-white/60"
            }`}
          >
            {badge}
          </div>
          <div className="mt-4 text-2xl font-semibold text-white">{name}</div>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <div className="text-4xl font-bold tracking-tight text-white">{price}</div>
        <div className="pb-1 text-sm text-white/45">{period}</div>
      </div>

      <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/65">
        {description}
      </p>

      {checkoutPlan ? (
        <PlanButton
          plan={checkoutPlan}
          label={ctaLabel}
          featured={featured}
          loading={loadingPlan === checkoutPlan}
          onCheckout={onCheckout}
        />
      ) : (
        <Link
          href={ctaHref || "/"}
          className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            featured
              ? "bg-cyan-300 text-black hover:opacity-90"
              : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
        >
          {ctaLabel}
        </Link>
      )}

      <div className="mt-6 h-px bg-white/10" />

      <div className="mt-6 space-y-3">
        {features.map((item) => (
          <div key={item} className="flex items-start gap-3 text-sm text-white/80">
            <span className="mt-0.5 text-cyan-300">●</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "advance" | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  async function startCheckout(plan: "pro" | "advance") {
    try {
      setCheckoutError("");
      setLoadingPlan(plan);

      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "checkout session creation failed",
        );
      }

      if (!data?.url || typeof data.url !== "string") {
        throw new Error("checkout url not returned");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("CHECKOUT_START_FAIL", error);
      setCheckoutError("Checkout の開始に失敗しました。少し時間を置いて再度お試しください。");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              FRNow Pricing
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              使い方に合わせて、
              <span className="text-cyan-300"> Free / Pro / Advance </span>
              を選ぶ。
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-white/68 md:text-lg">
              公開ランキングだけを見るなら Free。ランキングを深く使うなら Pro。
              ADV signals と outcome dashboard まで使うなら Advance。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ranking"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                公開ランキングを見る
              </Link>
              <Link
                href="/adv"
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Advance の詳細を見る
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/55">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Manual trading support
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Ranking + ADV dashboard
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Not an auto-trading bot
              </span>
            </div>

            {checkoutError ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {checkoutError}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle
          eyebrow="Plans"
          title="用途ごとの 3プラン"
          desc="まずは Free で触れて、ランキングを深く使うなら Pro、ADV signals と dashboard まで使うなら Advance です。"
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              name={plan.name}
              badge={plan.badge}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              ctaHref={"ctaHref" in plan ? plan.ctaHref : undefined}
              ctaLabel={plan.ctaLabel}
              checkoutPlan={"checkoutPlan" in plan ? plan.checkoutPlan : undefined}
              featured={plan.featured}
              features={plan.features}
              loadingPlan={loadingPlan}
              onCheckout={startCheckout}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Compare"
            title="プラン比較"
            desc="Advance は ranking だけでなく、ADV signals と performance dashboard を含む上位プランです。"
          />

          <div className="mt-10 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-6 py-4 font-medium text-white/45">Feature</th>
                  <th className="px-6 py-4 font-medium text-white/45">Free</th>
                  <th className="px-6 py-4 font-medium text-white/45">Pro</th>
                  <th className="px-6 py-4 font-medium text-cyan-300">Advance</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-6 py-4 text-white">{row.label}</td>
                    <td className="px-6 py-4 text-white/70">
                      {row.free ? <CheckIcon /> : <CrossIcon />}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {row.pro ? <CheckIcon /> : <CrossIcon />}
                    </td>
                    <td className="px-6 py-4 text-cyan-200">
                      {row.advance ? <CheckIcon /> : <CrossIcon />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-white/45">
            表示指標は記録済みシグナル結果ベースであり、口座連携された実現損益ではありません。
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle
          eyebrow="Which plan"
          title="どのプランを選べばいいか"
          desc="迷ったら、使いたい画面と必要な深さで選ぶのが分かりやすいです。"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-lg font-semibold text-white">Free</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              まずは公開ランキングを見たい人向け。FRNow の入口として使うプランです。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-lg font-semibold text-white">Pro</div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              ランキングと spread ranking を使って、取引所間の差や偏りを見たい人向けです。
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <div className="text-lg font-semibold text-white">Advance</div>
            <p className="mt-3 text-sm leading-6 text-white/75">
              ADV signals と /app/adv の performance dashboard まで使いたい人向けです。
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle eyebrow="FAQ" title="よくある質問" />

          <div className="mt-10 grid gap-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-base font-semibold text-white">{item.q}</div>
                <div className="mt-3 text-sm leading-6 text-white/65">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.03] to-white/[0.02] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-cyan-300">
                  Start with FRNow
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  ランキングから始めて、必要なら Advance まで広げる。
                </h2>
                <p className="mt-4 max-w-3xl text-white/65">
                  Free / Pro / Advance のどれを選んでも、FRNow の中心は
                  FR と OI の偏りを見て裁量判断に使うことです。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => startCheckout("pro")}
                  disabled={loadingPlan !== null}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingPlan === "pro" ? "Loading..." : "Proを開始"}
                </button>
                <button
                  type="button"
                  onClick={() => startCheckout("advance")}
                  disabled={loadingPlan !== null}
                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingPlan === "advance" ? "Loading..." : "Advanceを開始"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}