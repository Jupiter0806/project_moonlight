"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUser } from "@/lib/users-service";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUserById, upsertUsers } from "@/store/slices/entitiesSlice";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User as UserEntity } from "@/types/User";

type UserViewProps = {
  displayName?: string;
  email?: string;
  avatarSrc?: string;
};

export function User({ uid }: { uid: string }) {
  const user = useAppSelector(selectUserById(uid));
  const dispatch = useAppDispatch();

  const { data: fetchedUser } = useQuery({
    queryKey: ["user", uid],
    queryFn: () => getUser(uid),
    enabled: Boolean(uid) && !user,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (fetchedUser) {
      dispatch(upsertUsers([fetchedUser]));
    }
  }, [dispatch, fetchedUser]);

  const resolvedUser: UserEntity | undefined = user ?? fetchedUser;

  return (
    <UserView
      displayName={resolvedUser?.displayName}
      email={resolvedUser?.email}
      avatarSrc="https://example.com"
    />
  );
}

export function UserView({ displayName, email, avatarSrc }: UserViewProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage src={avatarSrc} alt={displayName ?? "User Avatar"} />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div>
        <h4>{displayName ?? "Guest"}</h4>
        <p>{email}</p>
      </div>
    </div>
  );
}
