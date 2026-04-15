jest.mock("../../src/config/firebase.js", () => {
  const mockCollection = jest.fn(() => ({
    doc: jest.fn((id?: string) => ({
      id: id ?? "generated-id",
      set: jest.fn().mockResolvedValue(undefined),
    })),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] }),
  }));
  return {
    db: { collection: mockCollection, batch: jest.fn() },
    auth: { verifyIdToken: jest.fn() },
  };
});

// Mock reflectionService to isolate traceService tests
jest.mock("../../src/services/reflectionService.js", () => ({
  getReflectionForUser: jest.fn(),
}));

import { db } from "../../src/config/firebase.js";
import { getReflectionForUser } from "../../src/services/reflectionService.js";
import { getTraces, createTrace } from "../../src/services/traceService.js";

const mockDb = db as jest.Mocked<typeof db>;
const mockGetReflectionForUser = getReflectionForUser as jest.Mock;

describe("traceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTraces", () => {
    it("returns null when reflection not found or not owned by user", async () => {
      mockGetReflectionForUser.mockResolvedValue(null);

      const result = await getTraces("user-1", "nonexistent-reflection", 10);
      expect(result).toBeNull();
    });

    it("returns paginated traces when reflection belongs to user", async () => {
      mockGetReflectionForUser.mockResolvedValue({
        id: "ref-1",
        owner_id: "user-1",
        label: "Test",
        trace_ids: ["trace-1"],
        created_at: Date.now(),
      });

      const mockDocs = [
        {
          id: "trace-1",
          data: () => ({
            id: "trace-1",
            reflection_id: "ref-1",
            owner_id: "user-1",
            q: "What?",
            a: "This.",
            created_time: 1000,
          }),
        },
      ];
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      };
      (mockDb.collection as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTraces("user-1", "ref-1", 10);

      expect(result).not.toBeNull();
      if (!result) throw new Error("result should not be null");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]?.q).toBe("What?");
    });

    it("uses cursor and returns next cursor when more traces exist", async () => {
      mockGetReflectionForUser.mockResolvedValue({
        id: "ref-1",
        owner_id: "user-1",
        label: "Test",
        trace_ids: ["trace-1", "trace-2", "trace-3"],
        created_at: Date.now(),
      });

      const cursorDoc = { exists: true };
      const startAfter = jest.fn().mockReturnThis();
      const docs = [
        {
          id: "trace-1",
          data: () => ({
            id: "trace-1",
            reflection_id: "ref-1",
            owner_id: "user-1",
            q: "Q1",
            a: "A1",
            created_time: 1000,
          }),
        },
        {
          id: "trace-2",
          data: () => ({
            id: "trace-2",
            reflection_id: "ref-1",
            owner_id: "user-1",
            q: "Q2",
            a: "A2",
            created_time: 2000,
          }),
        },
        {
          id: "trace-3",
          data: () => ({
            id: "trace-3",
            reflection_id: "ref-1",
            owner_id: "user-1",
            q: "Q3",
            a: "A3",
            created_time: 3000,
          }),
        },
      ];
      const get = jest.fn().mockResolvedValue({ docs });
      const docGet = jest.fn().mockResolvedValue(cursorDoc);

      (mockDb.collection as jest.Mock).mockImplementation((name: string) => {
        if (name === "traces") {
          return {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            startAfter,
            get,
            doc: jest.fn(() => ({ get: docGet })),
          };
        }
        return {
          doc: jest.fn(() => ({ get: docGet })),
        };
      });

      const cursor = Buffer.from("trace-cursor", "utf8").toString("base64url");
      const result = await getTraces("user-1", "ref-1", 2, cursor);

      expect(result).not.toBeNull();
      if (!result) throw new Error("result should not be null");
      expect(startAfter).toHaveBeenCalledWith(cursorDoc);
      expect(result.entries).toHaveLength(2);
      expect(result.pagination.cursor).toBe(
        Buffer.from("trace-2", "utf8").toString("base64url"),
      );
    });

    it("does not apply startAfter when cursor doc is missing", async () => {
      mockGetReflectionForUser.mockResolvedValue({
        id: "ref-1",
        owner_id: "user-1",
        label: "Test",
        trace_ids: [],
        created_at: Date.now(),
      });

      const startAfter = jest.fn().mockReturnThis();
      const docGet = jest.fn().mockResolvedValue({ exists: false });
      (mockDb.collection as jest.Mock).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter,
        get: jest.fn().mockResolvedValue({ docs: [] }),
        doc: jest.fn(() => ({ get: docGet })),
      }));

      const cursor = Buffer.from("missing-trace", "utf8").toString("base64url");
      await getTraces("user-1", "ref-1", 10, cursor);

      expect(startAfter).not.toHaveBeenCalled();
    });
  });

  describe("createTrace", () => {
    it("writes a trace doc and returns its ID", async () => {
      const mockRef = {
        id: "new-trace-id",
        set: jest.fn().mockResolvedValue(undefined),
      };
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      const id = await createTrace("user-1", "ref-1", "What is Y?", "Y is Z.");

      expect(id).toBe("new-trace-id");
      expect(mockRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-trace-id",
          reflection_id: "ref-1",
          owner_id: "user-1",
          q: "What is Y?",
          a: "Y is Z.",
        }),
      );
    });
  });
});
