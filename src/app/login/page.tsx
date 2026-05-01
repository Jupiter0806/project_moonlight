"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Page } from "@/components/Page/Page";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormState {
  error: string | null;
}

export default function LoginPage() {
  const { signIn, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const isMobile = useIsMobile();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const username = formData.get("username") as string;
      try {
        if (mode === "register") {
          await register(email, password, {
            displayName: username,
          });
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
    <Page className="max-w-xl! p-8">
      <div className="max-w-xl">
        <form action={formAction}>
          <FieldSet data-invalid={true}>
            <FieldLegend>
              {isRegister ? "Create account" : "Sign in"}
            </FieldLegend>

            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className={isMobile ? "" : "w-3xs!"}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isPending}
                />
              </Field>

              {mode === "register" && (
                <Field orientation="responsive">
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    className={isMobile ? "" : "w-3xs!"}
                    required
                    placeholder="Sen"
                    autoComplete="username"
                    disabled={isPending}
                  />
                </Field>
              )}

              <Field orientation="responsive">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className={isMobile ? "" : "w-3xs!"}
                  required
                  placeholder="Enter Password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldError>{state.error}</FieldError>
              </Field>
              <Field orientation="responsive">
                <Button type="submit" disabled={isPending}>
                  {/* todo, need persist form data, on submit will clear all form data */}{" "}
                  {isPending
                    ? isRegister
                      ? "Creating account…"
                      : "Signing in…"
                    : isRegister
                      ? "Create account"
                      : "Sign in"}
                </Button>
              </Field>
            </FieldGroup>

            <FieldDescription className="text-center">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isRegister ? "signin" : "register")}
                className="text-foreground font-medium underline underline-offset-2"
              >
                {isRegister ? "Sign in" : "Register"}
              </button>
            </FieldDescription>
          </FieldSet>
        </form>
      </div>
    </Page>
  );
}
