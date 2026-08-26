CREATE TABLE `support_tickets_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`workspace_id` text,
	`project_id` text,
	`contact_email` text,
	`contact_name` text,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch() * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch() * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `support_tickets_new` (`id`, `user_id`, `workspace_id`, `project_id`, `category`, `subject`, `message`, `status`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `workspace_id`, `project_id`, `category`, `subject`, `message`, `status`, `created_at`, `updated_at` FROM `support_tickets`;
--> statement-breakpoint
DROP TABLE `support_tickets`;
--> statement-breakpoint
ALTER TABLE `support_tickets_new` RENAME TO `support_tickets`;
--> statement-breakpoint
CREATE INDEX `support_tickets_workspace_idx` ON `support_tickets` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `support_tickets_status_idx` ON `support_tickets` (`status`);
--> statement-breakpoint
CREATE TABLE `support_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`author_user_id` text,
	`author_role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch() * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `support_replies_ticket_idx` ON `support_replies` (`ticket_id`);
