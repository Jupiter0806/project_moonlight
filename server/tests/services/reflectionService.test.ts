// Mock firebase-admin and the db/auth exports before any imports
jest.mock("../../src/config/firebase.js", () => {
  const mockBatch = {
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };
  const mockDoc = (id = "test-doc-id") => ({
    id,
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ exists: false }),
  });
  const mockCollection = jest.fn(() => ({
    doc: jest.fn((id?: string) => mockDoc(id ?? "generated-id")),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] }),
  }));
  return {
    db: { collection: mockCollection, batch: jest.fn(() => mockBatch) },
    auth: { verifyIdToken: jest.fn() },
  };
});

import { db } from "../../src/config/firebase.js";
import {
  getReflections,
  createReflection,
  createEmptyReflection,
} from "../../src/services/reflectionService.js";

const mockDb = db as jest.Mocked<typeof db>;

describe("reflectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getReflections", () => {
    it("returns empty paginated response when no docs found", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };
      (mockDb.collection as jest.Mock).mockReturnValue(mockQuery);

      const result = await getReflections("user-1", 10);

      expect(result.entries).toHaveLength(0);
      expect(result.pagination.cursor).toBe("");
      expect(result.pagination.size).toBe(0);
    });

    it("returns entries and empty cursor when fewer docs than limit", async () => {
      const mockDocs = [
        {
          id: "ref-1",
          data: () => ({
            id: "ref-1",
            label: "Test",
            owner_id: "user-1",
            trace_ids: [],
            created_at: Date.now(),
          }),
        },
      ];
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      };
      (mockDb.collection as jest.Mock).mockReturnValue(mockQuery);

      const result = await getReflections("user-1", 10);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]?.id).toBe("ref-1");
      expect(result.pagination.cursor).toBe("");
    });
  });

  describe("createReflection", () => {
    it("commits a batch and returns the generated reflection ID", async () => {
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      const mockRef = { id: "new-reflection-id", set: jest.fn() };
      const mockTraceRef = { id: "new-trace-id", set: jest.fn() };
      const mockCollection = jest.fn(() => ({
        doc: jest
          .fn()
          .mockReturnValueOnce(mockRef)
          .mockReturnValueOnce(mockTraceRef),
      }));
      (mockDb.collection as jest.Mock).mockImplementation(mockCollection);
      (mockDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const id = await createReflection("user-1", {
        label: "My Reflection",
        traces: [{ q: "What is X?", a: "X is Y.", created_time: Date.now() }],
      });

      expect(id).toBe("new-reflection-id");
      expect(mockBatch.set).toHaveBeenCalledTimes(2); // reflection + 1 trace
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe("createEmptyReflection", () => {
    it("creates a reflection with no traces", async () => {
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      const mockRef = { id: "empty-reflection-id" };
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockRef),
      });
      (mockDb.batch as jest.Mock).mockReturnValue(mockBatch);

      const id = await createEmptyReflection("user-1", "New Reflection");

      expect(id).toBe("empty-reflection-id");
      expect(mockBatch.set).toHaveBeenCalledTimes(1); // reflection only
    });
  });
});
