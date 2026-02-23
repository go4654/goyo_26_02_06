-- 멱등 처리: 이미 적용된 DB에서 재실행 시 충돌 방지 (컬럼 DROP/재생성 없음)
ALTER TABLE "class_comments" ADD COLUMN IF NOT EXISTS "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER POLICY "select-class-comments" ON "class_comments" TO public USING (
          "class_comments"."is_deleted" = false
          AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = "class_comments"."class_id"
            AND c.is_deleted = false
            AND (
              c.is_published = true
              OR (
                (select auth.uid()) IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM profiles p
                  WHERE p.profile_id = (select auth.uid())
                  AND p.role = 'admin'
                )
              )
            )
          )
          AND (
            "class_comments"."is_visible" = true
            OR EXISTS (
              SELECT 1
              FROM profiles p
              WHERE p.profile_id = (select auth.uid())
              AND p.role = 'admin'
            )
          )
        );