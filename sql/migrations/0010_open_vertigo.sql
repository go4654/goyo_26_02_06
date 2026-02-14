ALTER TABLE "galleries" ADD COLUMN "category" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
CREATE INDEX "galleries_category_idx" ON "galleries" USING btree ("category");