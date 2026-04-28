import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignOutButton } from "./SignOutButton";

// --- Mocks ---

const mockSignOut = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Tests ---

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sign out label", () => {
    render(<SignOutButton />);
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("calls signOut and redirects to /login on success", async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects only after signOut resolves", async () => {
    const order: string[] = [];
    mockSignOut.mockImplementation(async () => {
      order.push("signOut");
    });
    mockPush.mockImplementation(() => {
      order.push("push");
    });

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(order).toEqual(["signOut", "push"]);
    });
  });

  it("shows 'Signing Out...' while in progress", async () => {
    let resolve: () => void;
    mockSignOut.mockImplementation(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(screen.getByText("Signing Out...")).toBeInTheDocument();
    });

    resolve!();
    await waitFor(() => {
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });
  });

  it("ignores clicks while signing out", async () => {
    let resolve: () => void;
    mockSignOut.mockImplementation(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() =>
      expect(screen.getByText("Signing Out...")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Signing Out..."));
    fireEvent.click(screen.getByText("Signing Out..."));

    resolve!();
    await waitFor(() =>
      expect(screen.getByText("Sign Out")).toBeInTheDocument(),
    );

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("does not redirect and re-enables the button when signOut throws", async () => {
    mockSignOut.mockRejectedValue(
      new Error("Failed to end session. Please try again."),
    );

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
