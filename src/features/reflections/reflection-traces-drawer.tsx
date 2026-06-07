import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { getReflection, getReflectionTraces } from "@/lib/reflections-services";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTraceError,
  selectReflectionById,
  setTraceError,
  setTraceFetchStatus,
  upsertReflections,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import type { Reflection } from "@/types/Reflection";
import { TraceList } from "../traces/trace-list";

type ReflectionTracesDrawerProps = {
  reflectionId: string;
  open: boolean;
  onClose: () => void;
};

type ReflectionTracesDrawerViewProps = {
  reflection?: Reflection;
  isReflectionLoading: boolean;
  open: boolean;
  onClose: () => void;
};

export function ReflectionTracesDrawer({
  reflectionId,
  open,
  onClose,
}: ReflectionTracesDrawerProps) {
  const storeReflection = useAppSelector((state) =>
    selectReflectionById(state, reflectionId),
  ) as Reflection | undefined;
  const dispatch = useAppDispatch();

  const { data: fetchedReflection, isFetching: isFetchingReflection } =
    useQuery({
      queryKey: ["reflection", reflectionId],
      queryFn: () => getReflection(reflectionId),
      enabled: open && !storeReflection,
      staleTime: Infinity,
      retry: false,
    });

  const resolvedReflection = storeReflection ?? fetchedReflection;

  useEffect(() => {
    if (fetchedReflection) {
      dispatch(upsertReflections([fetchedReflection]));
    }
  }, [dispatch, fetchedReflection]);

  return (
    <ReflectionTracesDrawerView
      open={open}
      onClose={onClose}
      reflection={resolvedReflection}
      isReflectionLoading={open && !resolvedReflection && isFetchingReflection}
    />
  );
}

function ReflectionTracesDrawerView({
  reflection,
  isReflectionLoading,
  open,
  onClose,
}: ReflectionTracesDrawerViewProps) {
  useReflectionTraces(reflection, open);

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent
        className="h-dvh max-h-dvh p-0 select-text before:inset-x-0 before:top-0 before:bottom-0 before:rounded-t-3xl before:rounded-b-none data-[vaul-drawer-direction=bottom]:mt-6 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-1.5rem)]"
        aria-describedby="Traces for selected reflection."
      >
        <DrawerHeader>
          <DrawerTitle>Traces</DrawerTitle>
        </DrawerHeader>
        <div
          data-vaul-no-drag
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 select-text"
        >
          {!reflection ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              {isReflectionLoading && <Skeleton className="h-4 w-3/4" />}
            </div>
          ) : (
            <TraceList entries={reflection.traceIds} isLoading={false} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function useReflectionTraces(
  reflection: Reflection | undefined,
  open: boolean,
) {
  const dispatch = useAppDispatch();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reflectionTraces", reflection?.id],
    queryFn: () => getReflectionTraces(reflection!.id, "bottom"),
    enabled: open && Boolean(reflection),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!reflection) {
      return;
    }

    if (isLoading) {
      reflection.traceIds.forEach((trace) => {
        dispatch(setTraceFetchStatus({ id: trace, status: "loading" }));
        dispatch(clearTraceError({ id: trace }));
      });
    } else if (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to flush chamber traces";

      reflection.traceIds.forEach((trace) => {
        dispatch(setTraceFetchStatus({ id: trace, status: "error" }));
        dispatch(setTraceError({ id: trace, error: message }));
      });
    } else if (data) {
      dispatch(upsertTraces(data.traces));
      reflection.traceIds.forEach((trace) => {
        dispatch(setTraceFetchStatus({ id: trace, status: "done" }));
        dispatch(clearTraceError({ id: trace }));
      });
    }
  }, [isLoading, error, data, dispatch, reflection]);
}

export default ReflectionTracesDrawer;
