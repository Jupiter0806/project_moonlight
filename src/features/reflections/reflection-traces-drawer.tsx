import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Reflection } from "@/types/Reflection";
import { TraceList } from "../traces/trace-list";
import { useQuery } from "@tanstack/react-query";
import { getReflectionTraces } from "@/lib/reflections-services";
import { Ref, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  clearTraceError,
  setTraceError,
  setTraceFetchStatus,
  upsertTraces,
} from "@/store/slices/entitiesSlice";

export function ReflectionTracesDrawer({
  reflection,
  open,
  onClose,
}: {
  reflection: Reflection;
  open: boolean;
  onClose: () => void;
}) {
  useReflectionTraces(reflection);

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent aria-describedby={"Traces for selected reflection."}>
        <DrawerHeader>
          <DrawerTitle>Reflection Traces</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <TraceList entries={reflection.traceIds} isLoading={false} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function useReflectionTraces(reflection: Reflection) {
  // todo
  // need to find which traces required to be fetched based on pagination cursor
  // and their fetch status in the store, then trigger fetch for those traces
  // for now, we just fetch all traces when the drawer opens, which is not ideal

  const dispatch = useAppDispatch();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reflectionTraces", reflection.id],
    queryFn: () => getReflectionTraces(reflection.id, "bottom"),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
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
  }, [isLoading, error, data]);
}

export default ReflectionTracesDrawer;
