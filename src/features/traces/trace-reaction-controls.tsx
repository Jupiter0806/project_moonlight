import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectTraceById, upsertTraces } from "@/store/slices/entitiesSlice";
import { updateTraceLiked } from "@/lib/chamberTraceService";
import { useRef, useState } from "react";
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { IconButton } from "@/components/icon-button";

interface TraceReactionControlsProps {
  traceId: string;
  className?: string;
}

export function TraceReactionControls({
  traceId,
  className,
}: TraceReactionControlsProps) {
  const dispatch = useAppDispatch();
  const trace = useAppSelector((state) => selectTraceById(state, traceId));
  const [isSaving, setIsSaving] = useState(false);
  const latestRequestIdRef = useRef(0);

  if (!trace) return null;

  const liked = trace.liked ?? null;

  const handleSetReaction = async (reaction: boolean) => {
    if (isSaving) return;

    const previousLiked = trace.liked ?? null;
    const nextLiked = previousLiked === reaction ? null : reaction;
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    dispatch(upsertTraces([{ ...trace, liked: nextLiked }]));
    setIsSaving(true);

    try {
      const response = await updateTraceLiked(trace.id, nextLiked);

      // Reconcile optimistic state with server-authoritative response and
      // ignore outdated responses from older requests.
      if (latestRequestIdRef.current === requestId) {
        dispatch(upsertTraces([{ ...trace, liked: response.liked }]));
      }
    } catch {
      // Keep UX snappy with optimistic update; rollback if persistence fails.
      if (latestRequestIdRef.current === requestId) {
        dispatch(upsertTraces([{ ...trace, liked: previousLiked }]));
      }
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className={cn("mt-3 flex items-center gap-2", className)}>
      <IconButton
        type="button"
        size="icon-2xs"
        variant="ghost"
        aria-pressed={liked === true}
        disabled={isSaving}
        className={cn(
          "text-muted-foreground/65 hover:bg-muted/20 hover:text-muted-foreground",
          liked === true && "bg-muted/35 text-foreground/75 hover:bg-muted/40",
        )}
        icon={liked === true ? <BiSolidLike /> : <BiLike />}
        accessibleLabel="Like trace"
        onClick={() => void handleSetReaction(true)}
      />
      <IconButton
        type="button"
        size="icon-2xs"
        variant="ghost"
        aria-pressed={liked === false}
        disabled={isSaving}
        className={cn(
          "text-muted-foreground/65 hover:bg-muted/20 hover:text-muted-foreground",
          liked === false && "bg-muted/35 text-foreground/75 hover:bg-muted/40",
        )}
        icon={liked === false ? <BiSolidDislike /> : <BiDislike />}
        accessibleLabel="Dislike trace"
        onClick={() => void handleSetReaction(false)}
      />
    </div>
  );
}
