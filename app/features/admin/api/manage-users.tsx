/**
 * Admin User Management API Endpoint
 *
 * This file implements an API endpoint for administrators to manage users.
 * Only administrators can access this endpoint to view, update, or delete user accounts.
 *
 * Key features:
 * - Admin-only access control
 * - User listing and management
 * - Role management
 * - Comprehensive error handling
 */
import type { Route } from "./+types/manage-users";

import { data } from "react-router";
import { z } from "zod";

import { requireAdmin, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for user management operations
 */
const updateUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]).optional(),
  name: z.string().min(1).optional(),
});

/**
 * Action handler for admin user management
 *
 * This function handles user management operations:
 * 1. Validates admin permissions
 * 2. Processes user update requests
 * 3. Updates user profiles
 *
 * Security considerations:
 * - Requires admin authentication
 * - Validates all inputs
 * - Uses server-side validation
 *
 * @param request - The incoming HTTP request
 * @returns Response indicating success or error
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST, PUT, DELETE)
  requireMethod(request.method === "POST" ? "POST" : request.method === "PUT" ? "PUT" : "DELETE")(
    request,
  );

  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);

  // Verify the user is an admin
  await requireAdmin(client);

  const formData = await request.formData();
  const operation = formData.get("operation")?.toString() || "list";

  // List all users (for admin dashboard)
  if (operation === "list") {
    const { data: profiles, error } = await client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return data({ error: error.message }, { status: 500 });
    }

    return data({ users: profiles });
  }

  // Update user role or profile
  if (operation === "update") {
    const result = updateUserSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
      return data(
        { fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { userId, ...updates } = result.data;

    const { error } = await client
      .from("profiles")
      .update(updates)
      .eq("profile_id", userId);

    if (error) {
      return data({ error: error.message }, { status: 500 });
    }

    return data({ success: true });
  }

  return data({ error: "Invalid operation" }, { status: 400 });
}
