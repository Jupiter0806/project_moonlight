import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchTimelineArg,
  TimelineApiResponse,
  URTTimeline,
} from "@/store/thunks/fetchTimelineThunk";
import { MOCK_DB } from "@/store/thunks/fetchTimelineThunk";

export const timelineApi = createApi({
  reducerPath: "timelineApi",
  // fakeBaseQuery: no HTTP base URL — each endpoint uses queryFn with its own fetch logic.
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getTimeline: builder.query<TimelineApiResponse, FetchTimelineArg>({
      queryFn: async ({ timeline, cursor, direction }) => {
        console.debug("timeline", { timeline, cursor, direction });

        if (timeline === "chamberTraces") {
          const qs = new URLSearchParams({
            direction: direction === "top" ? "top" : "bottom",
            limit: "20",
          });
          if (cursor) qs.set("cursor", cursor);

          const path = `/api/chamber/traces?${qs.toString()}`;
          const url =
            typeof window !== "undefined"
              ? // why
                new URL(path, window.location.origin).toString()
              : `http://localhost${path}`;

          const res = await fetch(url);
          if (!res.ok) {
            const contentType = res.headers.get("content-type");
            let errorMessage = `Failed to fetch timeline (${res.status})`;

            if (contentType?.includes("application/json")) {
              try {
                const data = (await res.json()) as { error?: string };
                errorMessage = data.error || errorMessage;
              } catch {
                // Ignore JSON parse failures so the HTTP status remains visible.
              }
            }

            return {
              error: {
                status: "CUSTOM_ERROR" as const,
                error: errorMessage,
              },
            };
          }

          return { data: (await res.json()) as TimelineApiResponse };
        }

        // Simulate network latency for mock timelines.
        await new Promise<void>((r) => setTimeout(r, 400));

        const mock = MOCK_DB[timeline as URTTimeline];
        if (!mock) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: `No data for timeline: ${timeline}`,
            },
          };
        }

        // TODO: replace mock with real API call:
        // const res = await fetch(`/api/timeline/${timeline}?cursor=${cursor}&direction=${direction}`);
        // if (!res.ok) return { error: { status: res.status, error: await res.text() } };
        // return { data: await res.json() };

        return { data: mock };
      },
    }),
  }),
});

export const { useGetTimelineQuery } = timelineApi;
