CREATE TABLE `briefing_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_date` text NOT NULL,
	`region` text NOT NULL,
	`headline` text NOT NULL,
	`summary` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text NOT NULL,
	`source_type` text NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
