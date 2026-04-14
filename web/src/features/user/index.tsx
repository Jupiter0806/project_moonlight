"use client";

import { useAppSelector } from "@/store/hooks";
import { selectUserId } from "@/store/slices/sessionSlice";

export function User() {
  const userId = useAppSelector(selectUserId);

  return <span>{userId}</span>;
}
