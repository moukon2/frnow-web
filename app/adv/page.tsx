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
      "Binance / Bybit / Bitget / MEXC / BingX を前提に、複数取引所の市場状態を横断して監視します。",
  },
];

const dashboardPoints = [
  "Cumulative signal return",
  "Max drawdown",
  "Win rate / PF",
  "Recent outcome log",
  "Exchange breakdown",
  "Close reason breakdown",
  "BingX を含む横断監視",
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
  { label: "Public ranking", free: "公開版", pro: "拡張版", advance: "拡張版" },
  { label: "BingX を含む監視対象", free: "利用可", pro: "利用可", advance: "利用可" },
  { label: "Spread ranking", free: "—", pro: "利用可", advance: "利用可" },
  { label: "ADV signals", free: "—", pro: "—", advance: "利用可" },
  { label: "ADV dashboard", free: "—", pro: "—", advance: "利用可" },
  { label: "Signal outcome tracking", free: "—", pro: "—", advance: "利用可" },
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
  {
    q: "対応取引所は？",
    a: "現在は Binance、Bybit、Bitget、MEXC、BingX の先物データを前提にしています。",
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

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/65">{description}</p>
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</div>
      <div
        className={`mt-3 text-3xl font-semibold ${
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
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-white/80">
          <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdvLandingPage() {
  return (
    <main className="bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle
            eyebrow="FRNow Advance"
            title="Funding Rate と OI の偏りを、実戦向けの ADV シグナルとして使う。"
            desc="FRNow Advance は、Funding Rate・Open Interest・短期需給の偏りをもとに、裁量トレード向けのシグナルと、その結果確認用ダッシュボードを提供します。Binance / Bybit / Bitget / MEXC / BingX を横断して監視できます。"
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Pricingを見る
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Loginして /app/adv へ
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/45">
            {[
              "Manual trading support",
              "Not an auto-trading bot",
              "ADV members dashboard",
              "Binance / Bybit / Bitget / MEXC / BingX",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] p-6">
            <div className="rounded-[28px] border border-white/10 bg-black/60 p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
                ADV Dashboard Preview
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Outcome-focused view
              </div>
              <div className="mt-2 text-sm text-white/55">Members only</div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SmallMetric
                  label="Cumulative Signal Return"
                  value="+824.7 bps"
                  tone="cyan"
                />
                <SmallMetric label="Tracked signal outcomes" value="30D" />
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-sm font-medium text-white/85">
                  Included in /app/adv
                </div>
                <div className="mt-4">
                  <CheckList items={dashboardPoints} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {featureCards.map((card) => (
              <FeatureCard
                key={card.title}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Use Cases"
          title="こんな使い方に向いています"
          desc="ADV は、単なるランキング閲覧より一歩踏み込んで、シグナルの質や偏りを継続的に確認したい人向けです。"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionTitle
          eyebrow="Comparison"
          title="Free / Pro / Advance の違い"
          desc="ランキングだけで十分か、ADV シグナルや実績ダッシュボードまで必要かで選びやすくしています。"
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
              <div className="text-white/70">{row.free}</div>
              <div className="text-white/80">{row.pro}</div>
              <div className="text-cyan-200">{row.advance}</div>
            </div>
          ))}
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
              Get Started
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              ADV シグナルを使うなら、
              <br />
              まずは Pricing から確認
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
              公開ページで雰囲気を確認したあと、必要なら Advance に進める構成です。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                Pricingを見る
              </Link>
              <Link
                href="/app/adv"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                会員ページを見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}