/**
 * Delete Account API Endpoint
 *
 * This file implements an API endpoint for completely deleting a user's account.
 * It handles authentication checks, user deletion from Supabase Auth, and cleanup
 * of associated storage resources.
 *
 * Key features:
 * - Request method validation (DELETE only)
 * - Authentication protection
 * - Complete user deletion from Supabase Auth
 * - Cleanup of user avatar from storage
 * - Redirection to home page after successful deletion
 * - Error handling for API errors
 */
import type { Route } from "./+types/delete-account";

import { data, redirect } from "react-router";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import { requireAuthentication, requireMethod } from "~/core/lib/guards.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";

// Supabase 삭제 에러 메시지를 한글로 매핑
const DELETE_ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  "Database error deleting user":
    "계정 삭제 중 데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

/**
 * Action handler for processing account deletion requests
 *
 * This function handles the complete account deletion flow:
 * 1. Validates that the request method is DELETE
 * 2. Authenticates the user making the request
 * 3. Deletes the user from Supabase Auth
 * 4. Attempts to clean up the user's avatar from storage
 * 5. Redirects to the home page or returns error response
 *
 * Security considerations:
 * - Requires DELETE method to prevent unintended account deletions
 * - Requires authentication to protect user accounts
 * - Uses admin client for user deletion (elevated permissions)
 * - Handles errors gracefully with appropriate status codes
 * - Performs cleanup of associated resources
 *
 * Note: This is a destructive operation that permanently removes the user's
 * account and associated data. It cannot be undone.
 *
 * @param request - The incoming HTTP request
 * @returns Redirect to home page or error response
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow DELETE)
  requireMethod("DELETE")(request);

  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);

  // Verify the user is authenticated
  await requireAuthentication(client);

  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();

  const userId = user!.id;

  // 1) 결제 등 사용자 연관 데이터 정리 (FK 제약 조건으로 인한 삭제 실패 방지)
  const { error: paymentsDeleteError } = await adminClient
    .from("payments")
    .delete()
    .eq("user_id", userId);

  if (paymentsDeleteError) {
    const supabaseError = paymentsDeleteError as {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    return data(
      {
        error: {
          message:
            "계정 삭제 중 결제 이력 정리 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          code: supabaseError.code,
          details: supabaseError.details,
          originalMessage: supabaseError.message,
        },
      },
      { status: 500 },
    );
  }

  // 2) Supabase Auth에서 사용자 삭제
  //    - Admin API 대신 Drizzle을 사용해 auth.users를 직접 삭제
  //    - e2e 테스트 헬퍼(deleteUser)와 동일한 패턴을 사용
  try {
    await db.delete(authUsers).where(eq(authUsers.id, userId));
  } catch (error) {
    const supabaseError = error as {
      message?: string;
      code?: string;
      details?: string;
    };

    const originalMessage = supabaseError.message ?? "Unknown error";
    const translatedMessage =
      DELETE_ACCOUNT_ERROR_MESSAGES[originalMessage] ??
      "계정 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

    return data(
      {
        error: {
          message: translatedMessage,
          code: supabaseError.code,
          details: supabaseError.details,
          originalMessage,
        },
      },
      { status: 500 },
    );
  }

  // Clean up user's avatar from storage (경로: {user_id}/avatar.{ext})
  // Note: We don't fail the request if this cleanup fails
  try {
    const { data: files } = await adminClient.storage
      .from("avatars")
      .list(user!.id);
    if (files?.length) {
      const names = files.map((f) => `${user!.id}/${f.name}`);
      await adminClient.storage.from("avatars").remove(names);
    }
  } catch {
    // 메인 삭제는 완료됐으므로 cleanup 실패는 무시
  }

  // Redirect to home page after successful deletion
  return redirect("/");
}
