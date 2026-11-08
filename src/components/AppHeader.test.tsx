import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppHeader } from "@/components/AppHeader";
import type { AuthUser } from "@/lib/auth";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

const mockUseAuth = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" {...props}>Toggle</button>,
}));

vi.mock("@/components/NotificationCenter", () => ({
  NotificationCenter: () => <div>Notifications Panel</div>,
}));

vi.mock("@/components/BrandLogo", () => ({
  BrandLogo: () => <div>StayOnStay</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: PropsWithChildren<Record<string, unknown>>) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

const customerUser: AuthUser = {
  id: "customer-1",
  email: "customer@stayonstay.com",
  firstName: "Anita",
  lastName: "Rao",
  displayName: "Anita Rao",
  initials: "AR",
  role: "customer",
  name: "Anita Rao",
  avatarUrl: "",
  avatar: "",
  loginTime: Date.now(),
};

describe("AppHeader", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: customerUser,
      logoutCurrentDevice: vi.fn(),
      logoutAllDevices: vi.fn(),
    });
  });

  it("renders customer navigation with emergency access", () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    );

    expect(screen.getByText("Hotels")).toBeInTheDocument();
    expect(screen.getAllByText("My Bookings").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Emergency").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Anita Rao").length).toBeGreaterThan(0);
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("shows session actions in the customer menu", () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    );

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("Logout all devices")).toBeInTheDocument();
  });
});
