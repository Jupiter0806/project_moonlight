import { getUsers } from "@/lib/users-service";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { upsertUsers } from "@/store/slices/entitiesSlice";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export function useHydrateMissingUsers(reflectionIds: string[]) {
  const dispatch = useAppDispatch();

  const missingUserIds = useAppSelector((state) => {
    const reflectionEntities = state.entities.reflections.entities;
    const userEntities = state.entities.users.entities;

    const missing = new Set<string>();
    for (const reflectionId of reflectionIds) {
      const reflection = reflectionEntities[reflectionId];
      if (!reflection?.uid) continue;
      if (!userEntities[reflection.uid]) {
        missing.add(reflection.uid);
      }
    }

    return [...missing].sort();
  });

  const queryKey = useMemo(
    () => ["users", missingUserIds.join(",")],
    [missingUserIds],
  );

  const { data: fetchedUsers } = useQuery({
    queryKey,
    queryFn: () => getUsers(missingUserIds),
    enabled: missingUserIds.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (fetchedUsers && fetchedUsers.length > 0) {
      dispatch(upsertUsers(fetchedUsers));
    }
  }, [dispatch, fetchedUsers]);
}
