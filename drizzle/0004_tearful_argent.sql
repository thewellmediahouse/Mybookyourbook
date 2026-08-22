ALTER TABLE `notifications` ADD `event_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_event_key_uid` ON `notifications` (`event_key`);--> statement-breakpoint
ALTER TABLE `profiles` ADD `email_product_updates` integer DEFAULT false NOT NULL;