import { cookies } from "next/headers";

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