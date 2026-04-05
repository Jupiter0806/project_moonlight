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

  it("calls signOut and redirects to /login when clicked", async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(<SignOutButton />);
    fireEvent.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("calls signOut before redirecting", async () => {
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
});
