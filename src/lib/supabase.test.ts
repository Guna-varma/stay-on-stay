import { describe, expect, it, vi, afterEach } from "vitest";
import { supabase, logoutAllDevices, logoutCurrentDevice } from "@/lib/supabase";

describe("supabase auth sign-out wrappers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signs out only the current device for local logout", async () => {
    const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValue({ error: null });

    await logoutCurrentDevice();

    expect(signOutSpy).toHaveBeenCalledWith({ scope: "local" });
  });

  it("signs out all devices for global logout", async () => {
    const signOutSpy = vi.spyOn(supabase.auth, "signOut").mockResolvedValue({ error: null });

    await logoutAllDevices();

    expect(signOutSpy).toHaveBeenCalledWith({ scope: "global" });
  });
});
