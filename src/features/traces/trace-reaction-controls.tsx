import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectTraceById, upsertTraces } from "@/store/slices/entitiesSlice";
import { updateTraceLiked } from "@/lib/chamberTraceService";
import { useRef } from "react";
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
  const latestRequestIdRef = useRef(0);
  const likedRequestAbortRef = useRef<AbortController | null>(null);

  if (!trace) return null;

  const liked = trace.liked ?? null;

  const handleSetReaction = async (reaction: boolean) => {
    const previousLiked = trace.liked ?? null;
    const nextLiked = previousLiked === reaction ? null : reaction;
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    // Latest-intent wins: cancel any previous liked update request in flight.
    likedRequestAbortRef.current?.abort();
    const abortController = new AbortController();
    likedRequestAbortRef.current = abortController;

    dispatch(upsertTraces([{ ...trace, liked: nextLiked }]));

    try {
      const response = await updateTraceLiked(
        trace.id,
        nextLiked,
        abortController.signal,
      );

      // Reconcile optimistic state with server-authoritative response and
      // ignore outdated responses from older requests.
      if (latestRequestIdRef.current === requestId) {
        dispatch(upsertTraces([{ ...trace, liked: response.liked }]));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      // Keep UX snappy with optimistic update; rollback if persistence fails.
      if (latestRequestIdRef.current === requestId) {
        dispatch(upsertTraces([{ ...trace, liked: previousLiked }]));
      }
    } finally {
      if (likedRequestAbortRef.current === abortController) {
        likedRequestAbortRef.current = null;
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
