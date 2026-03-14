import Link from "next/link";
import HomeRankingPreview from "@/components/home/HomeRankingPreview";

const features = [
  {
    title: "Funding Rate Ranking",
    description:
      "複数取引所の Funding Rate を監視し、異常な需給の偏りをリアルタイムで可視化します。",
  },
  {
    title: "Advanced Signals",
    description:
      "FR・OI・短期挙動をもとに、ADV結果や統計を確認できます。公開版と会員版を分離可能です。",
  },
  {
    title: "Multi-Exchange",
    description:
      "Binance / Bybit / Bitget / MEXC を前提に、mixランキングや将来の取引所フィルターに対応します。",
  },
];

const plans = [
  {
    name: "Free",
    price: "公開版",
    items: [
      "FRランキング 20件表示",
      "上位3銘柄のみ通貨名表示",
      "ADV統計の一部公開",
      "ログイン不要",
    ],
  },
  {
    name: "Pro",
    price: "ログイン",
    items: [
      "FRランキング全銘柄表示",
      "複数取引所フィルター",
      "本格的なランキング監視向け",
    ],
  },
  {
    name: "Advance",
    price: "上位プラン",
    items: [
      "Proの全機能",
      "ADV詳細閲覧",
      "リアルタイムトレード一覧",
      "高度な分析・履歴閲覧",
    ],
  },
];

export default function HomePage() {
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_left,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
                Funding Rate × Open Interest Signal Engine
              </div>

              <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
                FRNow
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">
                Funding Rate と Open Interest の異常を監視し、
                ランキングとシグナルをリアルタイムで可視化する
                デリバティブ監視サービスです。
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/ranking"
                  className="rounded-2xl bg-cyan-400 px-6 py-3 text-center font-semibold text-black transition hover:opacity-90"
                >
                  FR Rankingを見る
                </Link>

                <Link
                  href="/adv"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
                >
                  ADV Resultsを見る
                </Link>
              </div>
            </div>

            <HomeRankingPreview />
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm text-cyan-300">Public Ranking</div>
              <div className="mt-3 text-2xl font-bold">20 Symbols</div>
              <div className="mt-2 text-white/60">
                Freeでは全取引所mixの上位20件を表示。通貨名は上位3件のみ公開。
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm text-cyan-300">Public ADV</div>
              <div className="mt-3 text-2xl font-bold">Stats + Results</div>
              <div className="mt-2 text-white/60">
                Avg ret / Avg hold / Trades / Win rate と、ADV結果の一部を公開表示。
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm text-cyan-300">Realtime</div>
              <div className="mt-3 text-2xl font-bold">Live Updates</div>
              <div className="mt-2 text-white/60">
                ランキングは自動更新。会員向けにはより高度なリアルタイム表示へ拡張可能。
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Core Features
          </div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            FRNowでできること
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-4 leading-7 text-white/65">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Public Pages
              </div>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                公開ページだけでも
                <br />
                FRNowの強みが分かる
              </h2>

              <p className="mt-6 max-w-2xl leading-8 text-white/70">
                `/ranking` では Funding Rate の市場状況を、
                `/adv` では ADV 統計と公開結果を確認できます。
                まずは公開ページで雰囲気を掴み、必要なら Pro / Advance に進む構成です。
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/ranking"
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  公開ランキングを見る
                </Link>

                <Link
                  href="/adv"
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  公開ADVを見る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Plans
          </div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            プラン構成
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="text-sm text-cyan-300">{plan.price}</div>
              <h3 className="mt-2 text-2xl font-bold">{plan.name}</h3>

              <ul className="mt-6 space-y-3 text-white/70">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[32px] border border-cyan-400/20 bg-cyan-400/10 px-8 py-12 text-center">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">
            Start Now
          </div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            まずは公開ページから確認
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-cyan-50/80">
            FRNowは、公開ランキングと公開ADVページから体験できます。
            より深いランキング監視やリアルタイムトレード閲覧は、
            Pro / Advance で段階的に解放する構成です。
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/ranking"
              className="rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Rankingへ
            </Link>

            <Link
              href="/adv"
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              ADVへ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}