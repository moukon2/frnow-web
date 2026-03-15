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
      "BingX を含む公開データ確認",
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
      "Binance / Bybit / Bitget / MEXC / BingX 対応",
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
      "BingX を含む横断監視",
    ],
  },
];

const compareRows = [
  { label: "公開ランキング", free: true, pro: true, advance: true },
  { label: "BingX を含む監視対象", free: true, pro: true, advance: true },
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
    q: "対応取引所は？",
    a: "現在は Binance、Bybit、Bitget、MEXC、BingX の先物データを前提にしています。",
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
  return <span className="text-white/30">—</span>;
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
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
        {title}
      </h2>
      {desc ? (
        <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">{desc}</p>
      ) : null}
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
      className={`rounded-3xl border p-6 ${
        featured
          ? "border-cyan-400/25 bg-cyan-400/[0.08] shadow-[0_0_40px_rgba(34,211,238,0.08)]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {badge}
        </div>
        {featured ? (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Recommended
          </span>
        ) : null}
      </div>

      <div className="mt-5 text-2xl font-semibold text-white">{name}</div>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="pb-1 text-sm text-white/50">{period}</span>
      </div>

      <p className="mt-4 text-sm leading-7 text-white/65">{description}</p>

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
          href={ctaHref || "/ranking"}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          {ctaLabel}
        </Link>
      )}

      <ul className="mt-6 space-y-3">
        {features.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-white/80">
            <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
      setCheckoutError(
        "Checkout の開始に失敗しました。少し時間を置いて再度お試しください。",
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle
            eyebrow="FRNow Pricing"
            title="使い方に合わせて、Free / Pro / Advance を選ぶ。"
            desc="公開ランキングだけを見るなら Free。ランキングを深く使うなら Pro。ADV signals と outcome dashboard まで使うなら Advance。BingX を含む複数取引所の監視にも対応しています。"
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ranking"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              公開ランキングを見る
            </Link>
            <Link
              href="/adv"
              className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Advance の詳細を見る
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/45">
            {[
              "Manual trading support",
              "Ranking + ADV dashboard",
              "Binance / Bybit / Bitget / MEXC / BingX",
              "Not an auto-trading bot",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>

          {checkoutError ? (
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {checkoutError}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 lg:grid-cols-3">
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

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Comparison"
          title="機能比較"
          desc="まずは Free で雰囲気を確認し、ランキングを深く見たいなら Pro、ADV シグナルまで見たいなら Advance という分け方が分かりやすいです。"
        />

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-white">
            <div>Feature</div>
            <div>Free</div>
            <div>Pro</div>
            <div className="text-cyan-200">Advance</div>
          </div>

          {compareRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/10 px-4 py-4 text-sm"
            >
              <div className="text-white">{row.label}</div>
              <div className="text-white/70">{row.free ? <CheckIcon /> : <CrossIcon />}</div>
              <div className="text-white/80">{row.pro ? <CheckIcon /> : <CrossIcon />}</div>
              <div className="text-cyan-200">{row.advance ? <CheckIcon /> : <CrossIcon />}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-white/45">
          表示指標は記録済みシグナル結果ベースであり、口座連携された実現損益ではありません。
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Free
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">
              まずは公開ランキングを見たい人向け
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/65">
              FRNow の入口として使うプランです。BingX を含む市場の雰囲気確認にも向いています。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Pro
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">
              ランキングと spread ranking を使いたい人向け
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/65">
              取引所間の差や偏りを見たい人向けです。Binance / Bybit / Bitget / MEXC / BingX の比較に向いています。
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.08] p-6 shadow-[0_0_40px_rgba(34,211,238,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Advance
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">
              ADV signals と /app/adv まで使いたい人向け
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Funding Rate と Open Interest の偏りをもとに、BingX を含む横断監視と ADV ダッシュボードまで確認したい人に向いています。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle eyebrow="FAQ" title="よくある質問" />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h3 className="text-base font-semibold text-white">{item.q}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[36px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] p-8 md:p-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Start with FRNow
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              ランキングから始めて、必要なら Advance まで広げる。
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
              Free / Pro / Advance のどれを選んでも、FRNow の中心は FR と OI の偏りを見て裁量判断に使うことです。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
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
      </section>
    </main>
  );
}