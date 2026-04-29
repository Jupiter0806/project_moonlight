"use client";

import { useAppSelector } from "@/store/hooks";
import { selectUserById } from "@/store/slices/entitiesSlice";

export function User({ uid }: { uid: string }) {
  const user = useAppSelector(selectUserById(uid));

  return <span>User: {user?.displayName ?? uid}</span>;
}
