import { describe, expect, it, vi, beforeEach } from "vitest";
import { CamphorReflectionList } from "./camphor-reflection-list";
import { renderWithStore } from "@/tests/renderWithStore";
import {
  useGetTimelineQuery,
  useLazyGetTimelineQuery,
} from "@/store/api/timelineApi";

const listenerPropsSpy = vi.fn();

vi.mock("@/store/api/timelineApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/store/api/timelineApi")>();

  return {
    ...actual,
    useGetTimelineQuery: vi.fn(),
    useLazyGetTimelineQuery: vi.fn(),
  };
});

vi.mock("../reflections/reflection-list", () => ({
  ReflectionList: ({
    ids,
    isLoading,
    isRefreshing,
    hasMore,
  }: {
    ids: string[];
    isLoading: boolean;
    isRefreshing: boolean;
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    newItemsCount: number;
    onClickNewItems: () => void;
  }) => (
    <div
      data-testid="reflection-list"
      data-ids-count={ids.length}
      data-is-loading={String(isLoading)}
      data-is-refreshing={String(isRefreshing)}
      data-has-more={String(hasMore)}
    />
  ),
}));

vi.mock("./components/reflections-updates-listener", () => ({
  ReflectionsUpdatesListener: (props: {
    enabled: boolean;
    initialCursor?: string;
  }) => {
    listenerPropsSpy(props);
    return <div data-testid="reflections-updates-listener" />;
  },
}));

describe("CamphorReflectionList listener startup", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLazyGetTimelineQuery).mockReturnValue([
      vi.fn(),
      {
        isUninitialized: true,
        isFetching: false,
        data: undefined,
      },
    ] as unknown as ReturnType<typeof useLazyGetTimelineQuery>);
  });

  it("keeps updates listener disabled before the first list response", () => {
    vi.mocked(useGetTimelineQuery).mockReturnValueOnce({
      isSuccess: false,
      data: undefined,
    } as unknown as ReturnType<typeof useGetTimelineQuery>);

    renderWithStore(<CamphorReflectionList />);

    expect(listenerPropsSpy).toHaveBeenCalled();
    expect(listenerPropsSpy).toHaveBeenLastCalledWith({
      enabled: false,
      initialCursor: undefined,
    });
  });

  it("enables updates listener after first successful list response even when empty", () => {
    vi.mocked(useGetTimelineQuery).mockReturnValue({
      isSuccess: false,
      data: undefined,
    } as unknown as ReturnType<typeof useGetTimelineQuery>);

    renderWithStore(<CamphorReflectionList />);

    expect(listenerPropsSpy).toHaveBeenLastCalledWith({
      enabled: false,
      initialCursor: undefined,
    });

    vi.mocked(useGetTimelineQuery).mockReturnValue({
      isSuccess: true,
      data: {
        entries: [],
        reflections: [],
        traces: [],
        users: [],
        topCursor: undefined,
        bottomCursor: undefined,
      },
    } as unknown as ReturnType<typeof useGetTimelineQuery>);

    renderWithStore(<CamphorReflectionList />);

    expect(listenerPropsSpy).toHaveBeenLastCalledWith({
      enabled: true,
      initialCursor: undefined,
    });
  });

  it("passes initial cursor to listener after first successful response", () => {
    vi.mocked(useGetTimelineQuery).mockReturnValue({
      isSuccess: true,
      data: {
        entries: [],
        reflections: [],
        traces: [],
        users: [],
        topCursor: "cursor-top-1",
        bottomCursor: "cursor-bottom-1",
      },
    } as unknown as ReturnType<typeof useGetTimelineQuery>);

    renderWithStore(<CamphorReflectionList />);

    expect(listenerPropsSpy).toHaveBeenLastCalledWith({
      enabled: true,
      initialCursor: "cursor-top-1",
    });
  });
});
