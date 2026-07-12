ALTER TABLE `products` ADD `seo_title` text;--> statement-breakpoint
ALTER TABLE `products` ADD `seo_description` text;--> statement-breakpoint
ALTER TABLE `products` ADD `og_image` text;--> statement-breakpoint
ALTER TABLE `products` ADD `canonical_url` text;--> statement-breakpoint
ALTER TABLE `products` ADD `description_format` text DEFAULT 'plain' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `archived_at` integer;