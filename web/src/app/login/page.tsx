"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface FormState {
  error: string | null;
}

export default function LoginPage() {
  const { signIn, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      try {
        if (mode === "register") {
          await register(email, password);
        } else {
          await signIn(email, password);
        }
        router.push("/");
        return { error: null };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    { error: null },
  );

  const isRegister = mode === "register";

  return (
    <div className="bg-surface flex min-h-screen items-center justify-center p-8">
      <div className="bg-surface-elevated w-full max-w-sm rounded-xl border p-8 shadow">
        <h1 className="text-foreground mb-6 text-2xl font-bold tracking-tight">
          {isRegister ? "Create account" : "Sign in"}
        </h1>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-muted text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border-border bg-surface rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-muted text-sm" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="border-border bg-surface rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-foreground text-background hover:bg-foreground-hover mt-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="text-muted mt-6 text-center text-sm">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isRegister ? "signin" : "register")}
            className="text-foreground font-medium underline underline-offset-2"
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
