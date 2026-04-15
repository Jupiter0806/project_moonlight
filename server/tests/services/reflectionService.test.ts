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

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    arrayUnion: jest.fn((value: string) => ({ __op: "arrayUnion", value })),
  },
}));

import { db } from "../../src/config/firebase.js";
import {
  getReflections,
  createReflection,
  createEmptyReflection,
  appendTraceId,
  getReflectionForUser,
} from "../../src/services/reflectionService.js";
import { FieldValue } from "firebase-admin/firestore";

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

    it("uses cursor for pagination and returns next cursor when more docs exist", async () => {
      const startAfter = jest.fn().mockReturnThis();
      const cursorDoc = { exists: true };
      const mockDocs = [
        {
          id: "ref-1",
          data: () => ({
            id: "ref-1",
            label: "First",
            owner_id: "user-1",
            trace_ids: [],
            created_at: Date.now(),
          }),
        },
        {
          id: "ref-2",
          data: () => ({
            id: "ref-2",
            label: "Second",
            owner_id: "user-1",
            trace_ids: [],
            created_at: Date.now(),
          }),
        },
        {
          id: "ref-3",
          data: () => ({
            id: "ref-3",
            label: "Third",
            owner_id: "user-1",
            trace_ids: [],
            created_at: Date.now(),
          }),
        },
      ];
      const get = jest.fn().mockResolvedValue({ docs: mockDocs });
      const query = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter,
        get,
      };
      const docGet = jest.fn().mockResolvedValue(cursorDoc);

      (mockDb.collection as jest.Mock).mockImplementation((name: string) => {
        if (name === "reflections") {
          return {
            ...query,
            doc: jest.fn(() => ({ get: docGet })),
          };
        }
        return query;
      });

      const cursor = Buffer.from("cursor-doc", "utf8").toString("base64url");
      const result = await getReflections("user-1", 2, cursor);

      expect(docGet).toHaveBeenCalledTimes(1);
      expect(startAfter).toHaveBeenCalledWith(cursorDoc);
      expect(result.entries).toHaveLength(2);
      expect(result.pagination.cursor).toBe(
        Buffer.from("ref-2", "utf8").toString("base64url"),
      );
    });

    it("ignores cursor when cursor doc does not exist", async () => {
      const startAfter = jest.fn().mockReturnThis();
      const query = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter,
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };
      const docGet = jest.fn().mockResolvedValue({ exists: false });

      (mockDb.collection as jest.Mock).mockImplementation(() => ({
        ...query,
        doc: jest.fn(() => ({ get: docGet })),
      }));

      const cursor = Buffer.from("missing-doc", "utf8").toString("base64url");
      await getReflections("user-1", 10, cursor);

      expect(startAfter).not.toHaveBeenCalled();
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

  describe("appendTraceId", () => {
    it("updates reflection trace_ids with arrayUnion", async () => {
      const update = jest.fn().mockResolvedValue(undefined);
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({ update })),
      });

      await appendTraceId("ref-1", "trace-1");

      expect((FieldValue.arrayUnion as jest.Mock)).toHaveBeenCalledWith("trace-1");
      expect(update).toHaveBeenCalledWith({
        trace_ids: { __op: "arrayUnion", value: "trace-1" },
      });
    });
  });

  describe("getReflectionForUser", () => {
    it("returns null when reflection does not exist", async () => {
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false }),
        })),
      });

      const result = await getReflectionForUser("missing-ref", "user-1");
      expect(result).toBeNull();
    });

    it("returns null when reflection belongs to another user", async () => {
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ id: "ref-1", owner_id: "user-2" }),
          }),
        })),
      });

      const result = await getReflectionForUser("ref-1", "user-1");
      expect(result).toBeNull();
    });

    it("returns reflection when it belongs to the user", async () => {
      const reflection = {
        id: "ref-1",
        owner_id: "user-1",
        label: "A",
        trace_ids: [],
        created_at: Date.now(),
      };
      (mockDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => reflection,
          }),
        })),
      });

      const result = await getReflectionForUser("ref-1", "user-1");
      expect(result).toEqual(reflection);
    });
  });
});
