CREATE TABLE `waitlist_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL REFERENCES `products`(`id`) ON DELETE CASCADE,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`notified_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_product_email_uidx` ON `waitlist_subscriptions` (`product_id`,`email`);
--> statement-breakpoint
CREATE TABLE `wishlist_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`product_id` text NOT NULL REFERENCES `products`(`id`) ON DELETE CASCADE,
	`alert_type` text NOT NULL,
	`enabled` integer NOT NULL DEFAULT 1,
	`last_notified_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlist_alerts_user_product_type_uidx` ON `wishlist_alerts` (`user_id`,`product_id`,`alert_type`);
--> statement-breakpoint
CREATE INDEX `idx_wishlist_alerts_product` ON `wishlist_alerts` (`product_id`);
--> statement-breakpoint
CREATE INDEX `idx_wishlist_alerts_user` ON `wishlist_alerts` (`user_id`);
