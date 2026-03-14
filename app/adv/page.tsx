import Link from "next/link";

const featureCards = [
  {
    title: "FR + OI Signals",
    description:
      "Funding Rate と Open Interest を軸に、短期の需給偏りとクラウディングを監視。裁量で使いやすい ADV シグナルを提供します。",
  },
  {
    title: "Performance Dashboard",
    description:
      "Advance 会員は cumulative ret_bps、drawdown、win rate、profit factor、outcome log を /app/adv で確認できます。",
  },
  {
    title: "Multi-Exchange Coverage",
    description:
      "Binance / Bybit / Bitget / MEXC を前提に、複数取引所の市場状態を横断して監視します。",
  },
];

const dashboardPoints = [
  "Cumulative signal return",
  "Max drawdown",
  "Win rate / PF",
  "Recent outcome log",
  "Exchange breakdown",
  "Close reason breakdown",
];

const useCases = [
  {
    title: "Crowded market detection",
    body: "Funding Rate と OI の偏りから、過熱・逆流の兆候を早く掴みたい人向け。",
  },
  {
    title: "Manual execution support",
    body: "自動売買ではなく、裁量エントリー / exit 判断の材料として使いたい人向け。",
  },
  {
    title: "Signal quality tracking",
    body: "結果を dashboard で追いながら、ADV シグナルの挙動を定量的に見たい人向け。",
  },
];

const compareRows = [
  {
    label: "Public ranking",
    free: "公開版",
    pro: "拡張版",
    advance: "拡張版",
  },
  {
    label: "Spread ranking",
    free: "—",
    pro: "利用可",
    advance: "利用可",
  },
  {
    label: "ADV signals",
    free: "—",
    pro: "—",
    advance: "利用可",
  },
  {
    label: "ADV dashboard",
    free: "—",
    pro: "—",
    advance: "利用可",
  },
  {
    label: "Signal outcome tracking",
    free: "—",
    pro: "—",
    advance: "利用可",
  },
];

const faqs = [
  {
    q: "FRNow は自動売買ですか？",
    a: "いいえ。FRNow はエントリー / exit シグナル配信と、その結果確認のためのツールです。口座連携による自動売買前提ではありません。",
  },
  {
    q: "表示される実績は実現損益ですか？",
    a: "会員ページの指標は、記録済みシグナル結果ベースの集計です。口座連携された実現損益ではありません。",
  },
  {
    q: "どんな人向けですか？",
    a: "Funding Rate、Open Interest、短期需給の偏りを見て、裁量トレードの精度を上げたい人向けです。",
  },
];

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

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold ${
          tone === "cyan" ? "text-cyan-300" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
        >
          <span className="mr-2 text-cyan-300">●</span>
          {item}
        </div>
      ))}
    </div>
  );
}

export default function AdvLandingPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                FRNow Advance
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                Funding Rate と OI の偏りを、
                <span className="text-cyan-300"> 実戦向けの ADV シグナル</span>
                として使う。
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/68 md:text-lg">
                FRNow Advance は、Funding Rate・Open Interest・短期需給の偏りをもとに、
                裁量トレード向けのシグナルと、その結果確認用ダッシュボードを提供します。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Pricingを見る
                </Link>
                <Link
                  href="/login?next=/app/adv"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Loginして /app/adv へ
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Manual trading support
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Not an auto-trading bot
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  ADV members dashboard
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-cyan-300">
                    ADV Dashboard Preview
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    Outcome-focused view
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                  Members only
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SmallMetric label="30D Return" value="+824.7 bps" tone="cyan" />
                <SmallMetric label="Win Rate" value="57.4%" />
                <SmallMetric label="Profit Factor" value="1.43" tone="cyan" />
                <SmallMetric label="Trades" value="1284" />
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                      Cumulative Signal Return
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-cyan-300">
                      +824.7 bps
                    </div>
                    <div className="mt-1 text-sm text-white/45">
                      tracked signal outcomes
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                    30D
                  </div>
                </div>

                <div className="mt-5 h-44 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
                  <div className="flex h-full items-end gap-2">
                    {[24, 38, 33, 52, 49, 68, 74, 81, 77, 95, 104, 112].map(
                      (h, i) => (
                        <div key={i} className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-xl bg-cyan-300/80"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                  Included in /app/adv
                </div>
                <div className="mt-4">
                  <CheckList items={dashboardPoints} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle
          eyebrow="Why Advance"
          title="ADV は、シグナルを見るだけで終わらせない。"
          desc="会員ページでは、どれだけ積み上がったか、どこで勝っているか、どこで崩れているかを outcome ベースで確認できます。"
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featureCards.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Use Cases"
            title="こんな使い方を想定しています"
            desc="自動売買前提ではなく、短期の偏りや crowding を裁量で使う人向けの設計です。"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-black/20 p-6"
              >
                <div className="text-lg font-semibold text-white">{item.title}</div>
                <p className="mt-3 text-sm leading-6 text-white/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle
          eyebrow="Compare"
          title="公開版 / Pro / Advance"
          desc="Advance は ranking の拡張だけでなく、ADV signals と dashboard を含む上位プランです。"
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
                  <td className="px-6 py-4 text-white/65">{row.free}</td>
                  <td className="px-6 py-4 text-white/65">{row.pro}</td>
                  <td className="px-6 py-4 font-medium text-cyan-200">
                    {row.advance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-white/45">
          表示指標は記録済みシグナル結果ベースであり、口座連携された実現損益ではありません。
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="FAQ"
            title="よくある質問"
          />

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
                  Advance Access
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  ADV signals と outcome dashboard を使う。
                </h2>
                <p className="mt-4 max-w-3xl text-white/65">
                  FRNow の Advance では、ADV シグナルだけでなく、
                  /app/adv で cumulative ret_bps、drawdown、win rate、PF、
                  outcome log を確認できます。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Pricingを見る
                </Link>
                <Link
                  href="/login?next=/app/adv"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}