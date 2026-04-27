import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FetchTimelineArg,
  TimelineApiResponse,
  URTTimeline,
} from "@/store/thunks/fetchTimelineThunk";
import { MOCK_DB } from "@/store/thunks/fetchTimelineThunk";
import { getChamberTraces } from "@/lib/chamberTraceService";
import { getReflections } from "@/lib/reflections-services";
import { getTodayReflections } from "@/lib/moonlight-services";

export const timelineApi = createApi({
  reducerPath: "timelineApi",
  // fakeBaseQuery: no HTTP base URL — each endpoint uses queryFn with its own fetch logic.
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getTimeline: builder.query<TimelineApiResponse, FetchTimelineArg>({
      queryFn: async ({ timeline, cursor, direction }) => {
        console.debug("timeline", { timeline, cursor, direction });

        try {
          if (timeline === "chamberTraces") {
            const data = await getChamberTraces(direction, cursor);
            // todo
            // a proper typing required to separate the API response from the RTK Query wrapper's expected return type
            return { data: data as unknown as TimelineApiResponse };
          } else if (timeline === "camphorReflections") {
            const data = await getReflections(direction, cursor);
            // todo
            // a proper typing required to separate the API response from the RTK Query wrapper's expected return type
            return {
              data: data as unknown as TimelineApiResponse,
            };
          } else if (timeline === "moonlightReflections") {
            const data = await getTodayReflections(direction, cursor);
            // todo
            // a proper typing required to separate the API response from the RTK Query wrapper's expected return type
            return {
              data: data as unknown as TimelineApiResponse,
            };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching chamber traces.";
          return {
            error: {
              status: "FETCH_ERROR" as const,
              error: errorMessage,
            },
          };
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
