/**
 * User Profile Schema
 * 
 * This file defines the database schema for user profiles and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 */
import { sql } from "drizzle-orm";
import { boolean, pgPolicy, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * Profiles Table
 * 
 * Stores additional user profile information beyond the core auth data.
 * Links to Supabase auth.users table via profile_id foreign key.
 * 
 * Includes Row Level Security (RLS) policies to ensure users can only
 * access and modify their own profile data.
 */
export const profiles = pgTable(
  "profiles",
  {
    // Primary key that references the Supabase auth.users id
    // Using CASCADE ensures profile is deleted when user is deleted
    profile_id: uuid()
      .primaryKey()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    name: text().notNull(),
    avatar_url: text(),
    marketing_consent: boolean("marketing_consent").notNull().default(false),
    // User role: 'user' (default) or 'admin'
    role: text("role").notNull().default("user"),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only update their own profile
    // OR admins can update any profile
    pgPolicy("edit-profile-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`
        ${authUid} = ${table.profile_id} 
        OR EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
      using: sql`
        ${authUid} = ${table.profile_id} 
        OR EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),
    // RLS Policy: Users can only delete their own profile
    // OR admins can delete any profile
    pgPolicy("delete-profile-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${table.profile_id} 
        OR EXISTS (
          SELECT 1 FROM ${table} p
          WHERE p.profile_id = ${authUid}
          AND p.role = 'admin'
        )
      `,
    }),
    // RLS Policy: Users can view their own profile OR admins can view any profile
    // 자신의 프로필 조회는 항상 허용 (순환 참조 방지)
    pgPolicy("select-profile-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${table.profile_id} 
        OR (
          ${table.profile_id} != ${authUid}
          AND EXISTS (
            SELECT 1 FROM ${table} p
            WHERE p.profile_id = ${authUid}
            AND p.role = 'admin'
          )
        )
      `,
    }),
  ],
);
