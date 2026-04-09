"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push("/login");
  }

  return (
    <div
      className="border-border hover:bg-surface-hover flex h-12 w-full items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent md:w-[158px]"
      onClick={handleClick}
    >
      Sign Out
    </div>
  );
}
