"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();

  const next = params.get("next") || "/app/ranking";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("ログインに失敗しました");
      }

      router.replace(next);

    } catch {
      setError("ログインできませんでした");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">

        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 rounded bg-white/10"
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 rounded bg-white/10"
        />

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <button
          disabled={loading}
          className="w-full bg-cyan-400 text-black p-3 rounded font-semibold"
        >
          {loading ? "Loading..." : "Login"}
        </button>

      </form>
    </main>
  );
}