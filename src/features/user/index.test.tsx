import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithStore, createReduxStore } from "@/tests/renderWithStore";
import { User, UserView } from "./index";
import { screen, waitFor } from "@testing-library/react";
import { upsertUsers } from "@/store/slices/entitiesSlice";

const getUserMock = vi.fn();

vi.mock("@/lib/users-service", () => ({
  getUser: (...args: unknown[]) => getUserMock(...args),
}));

describe("User (container)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches missing user and renders hydrated data", async () => {
    getUserMock.mockResolvedValue({
      id: "u-1",
      displayName: "Alice",
      email: "alice@example.com",
    });

    const { reduxStore } = renderWithStore(<User uid="u-1" />);

    expect(screen.getByText("Guest")).toBeInTheDocument();

    await waitFor(() => {
      expect(getUserMock).toHaveBeenCalledWith("u-1");
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    expect(reduxStore.getState().entities.users.entities["u-1"]).toMatchObject({
      displayName: "Alice",
      email: "alice@example.com",
    });
  });

  it("does not fetch when user already exists in Redux", async () => {
    const reduxStore = createReduxStore();
    reduxStore.dispatch(
      upsertUsers([
        {
          id: "u-2",
          displayName: "Bob",
          email: "bob@example.com",
        },
      ]),
    );

    renderWithStore(<User uid="u-2" />, createStore(), reduxStore);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("does not fetch when uid is empty", async () => {
    renderWithStore(<User uid="" />);

    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});

describe("UserView (presentation)", () => {
  it("renders provided display data", () => {
    renderWithStore(
      <UserView
        displayName="Charlie"
        email="charlie@example.com"
        avatarSrc="https://example.com/charlie.png"
      />,
    );

    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("charlie@example.com")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("renders fallback values when display data is missing", () => {
    renderWithStore(<UserView />);

    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
  });
});
