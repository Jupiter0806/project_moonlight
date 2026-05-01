"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={loading ? undefined : handleClick}>
      {loading ? "Signing Out..." : "Sign Out"}
    </div>
  );
}
