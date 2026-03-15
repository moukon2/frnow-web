import { cookies } from "next/headers";

export type UserPlan = "public" | "pro" | "advance";

type SessionUser = {
  loggedIn: boolean;
  id?: string;
  email?: string | null;
  plan: UserPlan;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
};

function safeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getBackendToken(): Promise<string | null> {
  if (process.env.DEV_AUTH_BYPASS === "1") {
    return process.env.DEV_AUTH_TOKEN || null;
  }

  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value || null;
}

export function getApiBase(): string {
  return process.env.FRNOW_API_BASE || "https://api.frnow.io";
}

export function normalizePlan(plan: unknown): UserPlan {
  const value = String(plan || "").trim().toLowerCase();

  if (value === "advance" || value === "adv") {
    return "advance";
  }

  if (value === "pro") {
    return "pro";
  }

  return "public";
}

export function hasRequiredPlan(
  currentPlan: unknown,
  required: UserPlan | UserPlan[],
): boolean {
  const current = normalizePlan(currentPlan);
  const requiredPlans = Array.isArray(required) ? required : [required];

  if (requiredPlans.includes("public")) {
    return true;
  }

  if (current === "advance") {
    return requiredPlans.includes("advance") || requiredPlans.includes("pro");
  }

  if (current === "pro") {
    return requiredPlans.includes("pro");
  }

  return false;
}

export async function getSessionUser(): Promise<SessionUser> {
  if (process.env.DEV_AUTH_BYPASS === "1") {
    const devPlan = normalizePlan(process.env.DEV_AUTH_PLAN || "advance");
    return {
      loggedIn: true,
      id: "dev-user",
      email: "dev@example.com",
      plan: devPlan,
      billing_status: devPlan === "public" ? null : "active",
      current_period_end_ms: null,
    };
  }

  const token = await getBackendToken();
  if (!token) {
    return {
      loggedIn: false,
      plan: "public",
      billing_status: null,
      current_period_end_ms: null,
    };
  }

  try {
    const upstream = await fetch(`${getApiBase()}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (upstream.status === 401) {
      return {
        loggedIn: false,
        plan: "public",
        billing_status: null,
        current_period_end_ms: null,
      };
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("SERVER_AUTH_ME_FETCH_FAIL", {
        status: upstream.status,
        body: text,
      });
      return {
        loggedIn: false,
        plan: "public",
        billing_status: null,
        current_period_end_ms: null,
      };
    }

    const data = await upstream.json().catch(() => null);
    const rawUser = data?.user ?? data ?? {};

    return {
      loggedIn: true,
      id: safeString(rawUser?.id) ?? undefined,
      email: safeString(rawUser?.email),
      plan: normalizePlan(rawUser?.plan ?? data?.plan),
      billing_status: safeString(rawUser?.billing_status),
      current_period_end_ms: safeNumber(rawUser?.current_period_end_ms),
    };
  } catch (error) {
    console.error("SERVER_AUTH_GET_SESSION_USER_ERROR", error);
    return {
      loggedIn: false,
      plan: "public",
      billing_status: null,
      current_period_end_ms: null,
    };
  }
}