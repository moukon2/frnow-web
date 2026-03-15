"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RankingRow = {
  rank: number;
  symbol: string;
  exchange: string;
  fr: number;
  nextFundingMs?: number | null;
};

type RankingApiResponse = {
  rows?: Array<Record<string, unknown>>;
  error?: string;
  message?: string;
};

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>
      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  items,
  href,
  cta,
  featured = false,
}: {
  name: string;
  price: string;
  description: string;
  items: string[];
  href: string;
  cta: string;
  featured?: boolean;
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
        <div className="text-xl font-semibold text-white">{name}</div>
        {featured ? (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Recommended
          </span>
        ) : null}
      </div>

      <div className="mt-4 text-3xl font-bold text-white">{price}</div>
      <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>

      <ul className="mt-6 space-y-3 text-sm text-white/80">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={href}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            featured
              ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15"
              : "border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function pickNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function pickString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeRows(rows: Array<Record<string, unknown>>): RankingRow[] {
  const out: RankingRow[] = [];

  rows.forEach((item, index) => {
    const symbol = pickString(item.symbol) || pickString(item.name);
    const exchange = pickString(item.exchange) || pickString(item.ex);
    const fr =
      pickNumber(item.fr_percent) ??
      pickNumber(item.fr) ??
      pickNumber(item.funding_rate) ??
      pickNumber(item.fundingRate) ??
      pickNumber(item.rate);

    const nextFundingMs =
      pickNumber(item.next_funding_at_ms) ??
      pickNumber(item.nextFundingMs) ??
      pickNumber(item.next_funding_ms) ??
      pickNumber(item.nextFundingTime) ??
      pickNumber(item.next_funding_time);

    if (!symbol || !exchange || fr === null) return;

    out.push({
      rank: index + 1,
      symbol,
      exchange,
      fr,
      nextFundingMs,
    });
  });

  return out;
}

function formatNextFunding(nextFundingMs?: number | null): string {
  if (!nextFundingMs || !Number.isFinite(nextFundingMs)) return "--";

  const diffMs = nextFundingMs - Date.now();
  if (diffMs <= 0) return "00:00";

  const totalMin = Math.floor(diffMs / 60000);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function HomeRankingPreview() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const ex = ["binance", "bybit", "bitget", "mexc", "bingx"].join(",");
      const res = await fetch(`/api/fr-ranking?ex=${encodeURIComponent(ex)}`, {
        cache: "no-store",
      });

      const json: RankingApiResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      const allRows = normalizeRows(Array.isArray(json.rows) ? json.rows : []);
      setRows(allRows.slice(0, 3));
      setUpdatedAt(new Date());
    } catch (e) {
      console.error("HOME_RANKING_PREVIEW_FAIL", e);
      setRows([]);
      setError("ランキングの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return "--:--:--";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(updatedAt);
  }, [updatedAt]);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/15 bg-black/60 p-4 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="relative rounded-[28px] border border-white/10 bg-black/70 p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
              Live Ranking Preview
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              公開ランキング上位
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
            {loading ? "Loading..." : `Updated ${updatedLabel}`}
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-[44px_1fr_110px_110px_80px] items-center px-2 pb-3 text-xs uppercase tracking-[0.18em] text-white/40">
            <div>Rank</div>
            <div>Symbol</div>
            <div>Exchange</div>
            <div className="text-right">FR</div>
            <div className="text-right">Next</div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-8 text-center text-sm text-white/55">
              読み込み中...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-8 text-center text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-8 text-center text-sm text-white/55">
              表示できるデータがありません。
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={`${row.rank}-${row.symbol}-${row.exchange}`}
                  className="grid grid-cols-[44px_1fr_110px_110px_80px] items-center rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                >
                  <div className="font-semibold text-white/70">{row.rank}</div>
                  <div className="font-medium text-white">{row.symbol}</div>
                  <div className="text-white/55">{row.exchange}</div>
                  <div className="text-right font-semibold text-cyan-300">
                    {row.fr.toFixed(4)}%
                  </div>
                  <div className="text-right text-white/65">
                    {formatNextFunding(row.nextFundingMs)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-white/55">
          ここでは実際の公開ランキング上位のみを表示しています。
          表示の中心は Funding Rate です。OI は内部ロジックで使っていても、
          この画面では直接見せていません。
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              Funding Rate Analysis
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.05]">
              暗号資産先物の
              <br />
              Funding Rate を
              <br />
              すばやく可視化
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
              FRNow は Binance、Bybit、Bitget、MEXC、BingX の先物データを監視し、
              Funding Rate の偏りが強い銘柄を見つけやすくするための分析サービスです。
              OI は内部ロジックに活用していますが、現在の公開表示は FR 中心です。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ranking"
                className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                公開ランキングを見る
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                プランを見る
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/45">
              {["Binance", "Bybit", "Bitget", "MEXC", "BingX", "Discord", "Telegram"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <HomeRankingPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="What FRNow Does"
          title="FRNowでできること"
          description="FRNow は Funding Rate の偏りを見やすく整理し、ランキング確認から会員向けの高度なシグナル確認まで一つの流れで使えるようにしています。OI は内部ロジックに活用していますが、現在の可視化の中心は FR です。"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Funding Rate Ranking"
            description="複数取引所の Funding Rate を横断して確認し、需給の偏りが強い銘柄をすばやく見つけられます。Binance / Bybit / Bitget / MEXC / BingX をまとめて比較できます。"
            href="/ranking"
            cta="ランキングを見る"
          />
          <FeatureCard
            title="Advance Signals"
            description="会員向けでは FR を中心に、内部ロジックで OI も活用したシグナル確認ができます。ADV ダッシュボードでは成績や履歴も把握できます。"
            href="/adv"
            cta="ADVを見る"
          />
          <FeatureCard
            title="Multi-Exchange"
            description="Binance / Bybit / Bitget / MEXC / BingX の先物データを前提に、取引所ごとの比較や spread ranking に対応しています。"
            href="/pricing"
            cta="プランを見る"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Why It Matters"
          title="こんな人に向いています"
          description="FRNow は、Funding Rate の偏りを手動で毎回確認するのが面倒な人や、ランキングと会員向けシグナルをまとめて見たい人に向いています。"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "FRの偏りを素早く見たい",
              text: "Funding Rate が極端に動いている銘柄をランキング形式ですぐ確認したい人向けです。",
            },
            {
              title: "複数取引所をまとめて見たい",
              text: "Binance、Bybit、Bitget、MEXC、BingX を横断して比較したい人向けです。",
            },
            {
              title: "公開版から段階的に使いたい",
              text: "まずは公開ランキングを試し、必要なら Pro や Advance に進みたい人に向いています。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Supported Exchanges"
          title="対応取引所"
          description="現在は主要な暗号資産先物取引所を対象に、Funding Rate を追いやすい形でまとめています。"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {["Binance", "Bybit", "Bitget", "MEXC", "BingX"].map((exchange) => (
            <div
              key={exchange}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center"
            >
              <div className="text-lg font-semibold text-white">{exchange}</div>
              <div className="mt-2 text-sm text-white/50">Perpetual Futures</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Plans"
          title="用途に合わせて選べる3プラン"
          description="まずは公開ランキングを試し、必要に応じて Pro や Advance に上げる構成にしています。ランキング中心で使う人と、会員向けシグナルまで見たい人で分けやすくしています。"
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <PricingCard
            name="Free"
            price="公開版"
            description="まずはFRNowを試したい人向けです。"
            items={[
              "公開ランキング",
              "基本的な FR 確認",
              "BingX を含む公開データ確認",
            ]}
            href="/ranking"
            cta="公開ランキングを見る"
          />

          <PricingCard
            name="Pro"
            price="会員版 Ranking"
            description="ランキングや比較をしっかり見たい人向けです。"
            items={[
              "会員向けランキング",
              "取引所フィルタ",
              "spread ranking",
              "BingX を含む比較表示",
            ]}
            href="/pricing"
            cta="Proを見る"
          />

          <PricingCard
            name="Advance"
            price="ADV Signals"
            description="FR中心の可視化に加えて、会員向けの高度なシグナル確認まで使いたい人向けです。"
            items={[
              "ADV シグナル",
              "performance dashboard",
              "シグナル履歴・統計確認",
              "BingX を含む横断監視",
            ]}
            href="/pricing"
            cta="Advanceを見る"
            featured
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[36px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] p-8 md:p-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Get Started
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              まずは公開ランキングから試して、
              <br />
              必要なら会員プランへ
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
              無理に最初から全部使う必要はありません。まずはランキングの見やすさを確認し、
              必要になったら Pro や Advance へ進める流れにしています。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ranking"
                className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                公開ランキングを見る
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                料金プランを見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}