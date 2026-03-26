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
