CREATE TABLE `rate_limit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch() * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_events_bucket_idx` ON `rate_limit_events` (`bucket`,`created_at`);--> statement-breakpoint
ALTER TABLE `profiles` ADD `deleted_at` integer;