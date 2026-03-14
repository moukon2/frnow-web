import Link from "next/link";

type Variant = "login" | "upgrade" | "error";
type PlanName = "Pro" | "Advance" | "Account";

type Props = {
  variant: Variant;
  planName: PlanName;
  title?: string;
  description?: string;
  publicHref?: string;
  loginHref?: string;
  pricingHref?: string;
};

const copyMap = {
  Pro: {
    login: {
      title: "Pro会員向けページです",
      description:
        "このページを利用するにはログインが必要です。ログイン後、Pro以上のプランで利用できます。",
    },
    upgrade: {
      title: "現在のプランでは利用できません",
      description:
        "このページはPro以上のプランで利用できます。料金プランをご確認ください。",
    },
    error: {
      title: "データの取得に失敗しました",
      description:
        "時間をおいて再度お試しください。解消しない場合は公開版ページをご利用ください。",
    },
  },
  Advance: {
    login: {
      title: "Advance会員向けページです",
      description:
        "このページを利用するにはログインが必要です。ログイン後、Advanceプランで利用できます。",
    },
    upgrade: {
      title: "Advanceプラン限定ページです",
      description:
        "このページはAdvanceプランで利用できます。料金プランをご確認ください。",
    },
    error: {
      title: "データの取得に失敗しました",
      description:
        "時間をおいて再度お試しください。解消しない場合は公開版ページをご利用ください。",
    },
  },
  Account: {
    login: {
      title: "ログインが必要です",
      description:
        "このページを利用するにはログインが必要です。ログイン後にアカウント情報と課金状態を確認できます。",
    },
    upgrade: {
      title: "このページは利用できません",
      description:
        "アカウント情報の表示に問題があります。ログイン状態やプラン状態をご確認ください。",
    },
    error: {
      title: "データの取得に失敗しました",
      description:
        "時間をおいて再度お試しください。解消しない場合は pricing ページをご確認ください。",
    },
  },
} as const;

function showLoginButton(variant: Variant) {
  return variant === "login" || variant === "error";
}

function showPricingButton(planName: PlanName, variant: Variant) {
  if (planName === "Account") return true;
  return variant === "upgrade" || variant === "error" || variant === "login";
}

export default function PlanGateCard({
  variant,
  planName,
  title,
  description,
  publicHref,
  loginHref,
  pricingHref,
}: Props) {
  const copy = copyMap[planName][variant];
  const badgeLabel = planName === "Account" ? "Account" : `${planName} Only`;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
          {badgeLabel}
        </div>

        <h2 className="mt-4 text-3xl font-bold text-white">
          {title ?? copy.title}
        </h2>

        <p className="mt-4 text-white/70">
          {description ?? copy.description}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {showLoginButton(variant) ? (
            <Link
              href={loginHref ?? "/login"}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Login
            </Link>
          ) : null}

          {showPricingButton(planName, variant) ? (
            <Link
              href={pricingHref ?? "/pricing"}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Pricing
            </Link>
          ) : null}

          {publicHref ? (
            <Link
              href={publicHref}
              className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              公開版を見る
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}