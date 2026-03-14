import Link from "next/link";

type Variant = "unauthenticated" | "forbidden" | "error";

type Props = {
  variant: Variant;
  title?: string;
  description?: string;
  publicHref?: string;
};

const contentMap: Record<
  Variant,
  { title: string; description: string }
> = {
  unauthenticated: {
    title: "Pro以上の会員向けページです",
    description:
      "FRNowの会員向けランキングを見るにはログインが必要です。ログイン後、Pro以上のプランで利用できます。",
  },
  forbidden: {
    title: "現在のプランでは利用できません",
    description:
      "このページはPro以上のプランで利用できます。公開版ランキングは誰でも確認できます。",
  },
  error: {
    title: "データの取得に失敗しました",
    description:
      "時間をおいて再度お試しください。解消しない場合は、公開版ランキングをご利用ください。",
  },
};

export default function UpgradeRequiredCard({
  variant,
  title,
  description,
  publicHref = "/ranking",
}: Props) {
  const resolved = contentMap[variant];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Members Only
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title ?? resolved.title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-300 sm:text-base">
            {description ?? resolved.description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Login
            </Link>

            <Link
              href="/pricing"
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Pricing
            </Link>
          </div>

          <div className="mt-4">
            <Link
              href={publicHref}
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              公開ランキングを見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}