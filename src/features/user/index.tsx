"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/store/hooks";
import { selectUserById } from "@/store/slices/entitiesSlice";

export function User({ uid }: { uid: string }) {
  const user = useAppSelector(selectUserById(uid));

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage
          src={"https://example.com"}
          alt={user?.displayName ?? "User Avatar"}
        />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div>
        <h4>{user?.displayName ?? "Guest"}</h4>
        <p>{user?.email}</p>
      </div>
    </div>
  );
}
