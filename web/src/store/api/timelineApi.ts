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
        // Simulate network latency
        await new Promise<void>((r) => setTimeout(r, 400));

        console.debug("timeline", { timeline, cursor, direction });

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
