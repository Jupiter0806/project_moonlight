jest.mock("../src/config/firebase.js", () => ({
  db: {},
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock("../src/services/reflectionService.js", () => ({
  getReflections: jest.fn(),
  createReflection: jest.fn(),
  getReflectionForUser: jest.fn(),
  createEmptyReflection: jest.fn(),
  appendTraceId: jest.fn(),
}));

jest.mock("../src/services/traceService.js", () => ({
  getTraces: jest.fn(),
  createTrace: jest.fn(),
}));

jest.mock("../src/services/aiService.js", () => ({
  getAnswer: jest.fn(),
}));

import { createApp } from "../src/app.js";
import { auth } from "../src/config/firebase.js";
import {
  getReflections,
  createReflection,
  getReflectionForUser,
  createEmptyReflection,
  appendTraceId,
} from "../src/services/reflectionService.js";
import { getTraces, createTrace } from "../src/services/traceService.js";
import { getAnswer } from "../src/services/aiService.js";

const mockAuth = auth as jest.Mocked<typeof auth>;
const mockGetReflections = getReflections as jest.Mock;
const mockCreateReflection = createReflection as jest.Mock;
const mockGetReflectionForUser = getReflectionForUser as jest.Mock;
const mockCreateEmptyReflection = createEmptyReflection as jest.Mock;
const mockAppendTraceId = appendTraceId as jest.Mock;
const mockGetTraces = getTraces as jest.Mock;
const mockCreateTrace = createTrace as jest.Mock;
const mockGetAnswer = getAnswer as jest.Mock;

describe("createApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.verifyIdToken.mockResolvedValue({ uid: "user-1" } as never);
  });

  it("serves /health without auth", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 401 for missing Authorization header on /api routes", async () => {
    const app = createApp();
    const res = await app.request("/api/reflections?user_id=user-1");
    expect(res.status).toBe(401);
  });

  it("returns 403 when query user_id mismatches authenticated user", async () => {
    const app = createApp();
    const res = await app.request("/api/reflections?user_id=other-user", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(403);
  });

  it("returns reflections for authenticated user", async () => {
    mockGetReflections.mockResolvedValue({
      pagination: { size: 1, cursor: "" },
      entries: [{ id: "r1", label: "A", owner_id: "user-1", trace_ids: [] }],
    });
    const app = createApp();

    const res = await app.request(
      "/api/reflections?user_id=user-1&counts=10&cursor=abc",
      {
        headers: { Authorization: "Bearer valid-token" },
      },
    );

    expect(res.status).toBe(200);
    expect(mockGetReflections).toHaveBeenCalledWith("user-1", 10, "abc");
  });

  it("creates reflection via POST /api/reflection", async () => {
    mockCreateReflection.mockResolvedValue("new-ref");
    const app = createApp();

    const res = await app.request("/api/reflection?user_id=user-1", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: "My Reflection",
        traces: [{ q: "Q", a: "A", created_time: 1 }],
      }),
    });

    expect(res.status).toBe(201);
    expect(mockCreateReflection).toHaveBeenCalledWith("user-1", {
      label: "My Reflection",
      traces: [{ q: "Q", a: "A", created_time: 1 }],
    });
  });

  it("returns 404 for traces when reflection is not accessible", async () => {
    mockGetTraces.mockResolvedValue(null);
    const app = createApp();

    const res = await app.request(
      "/api/traces?user_id=user-1&reflection_id=missing&counts=10",
      {
        headers: { Authorization: "Bearer valid-token" },
      },
    );

    expect(res.status).toBe(404);
  });

  it("creates reflection automatically in /api/answer when reflection_id is missing", async () => {
    mockCreateEmptyReflection.mockResolvedValue("generated-ref");
    mockGetAnswer.mockResolvedValue("AI answer");
    mockCreateTrace.mockResolvedValue("trace-1");
    const app = createApp();

    const res = await app.request(
      "/api/answer?user_id=user-1&question=What%20is%20X%3F",
      {
        headers: { Authorization: "Bearer valid-token" },
      },
    );

    expect(res.status).toBe(200);
    expect(mockCreateEmptyReflection).toHaveBeenCalledWith(
      "user-1",
      "New Reflection",
    );
    expect(mockCreateTrace).toHaveBeenCalledWith(
      "user-1",
      "generated-ref",
      "What is X?",
      "AI answer",
    );
    expect(mockAppendTraceId).toHaveBeenCalledWith("generated-ref", "trace-1");
  });

  it("returns 404 in /api/answer when reflection_id is not owned by user", async () => {
    mockGetReflectionForUser.mockResolvedValue(null);
    const app = createApp();

    const res = await app.request(
      "/api/answer?user_id=user-1&reflection_id=ref-123&question=Hi",
      {
        headers: { Authorization: "Bearer valid-token" },
      },
    );

    expect(res.status).toBe(404);
    expect(mockGetAnswer).not.toHaveBeenCalled();
  });
});
