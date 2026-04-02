import { beforeEach, describe, expect, it, vi } from "vitest";

const listUsers = vi.fn();
const createUser = vi.fn();
const upsert = vi.fn();
const from = vi.fn(() => ({ upsert }));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: {
      admin: {
        listUsers,
        createUser,
      },
    },
    from,
  }),
}));

vi.mock("@/lib/env", () => ({
  getOwnerEmail: () => "owner@example.com",
}));

import { POST } from "@/app/api/auth/register-owner/route";

describe("POST /api/auth/register-owner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    createUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    upsert.mockResolvedValue({ error: null });
  });

  it("rejects a non-owner email", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "other@example.com",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("rejects duplicate owner creation", async () => {
    listUsers.mockResolvedValue({
      data: { users: [{ id: "existing-user" }] },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@example.com",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(createUser).not.toHaveBeenCalled();
  });
});
