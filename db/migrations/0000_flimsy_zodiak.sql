CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`typical_roles` text,
	`is_seeded` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE TABLE `reflection_games` (
	`reflection_id` text NOT NULL,
	`game_id` text NOT NULL,
	PRIMARY KEY(`reflection_id`, `game_id`),
	FOREIGN KEY (`reflection_id`) REFERENCES `reflections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reflection_skills` (
	`reflection_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`reflection_id`, `skill_id`),
	FOREIGN KEY (`reflection_id`) REFERENCES `reflections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`body` text NOT NULL,
	`mood` integer,
	`energy` integer,
	`intensity` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skill_in_games` (
	`skill_id` text NOT NULL,
	`game_id` text NOT NULL,
	`role` text NOT NULL,
	`notes` text,
	`ai_suggested` integer NOT NULL,
	`ai_confidence` real,
	PRIMARY KEY(`skill_id`, `game_id`, `role`),
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`session_id` text NOT NULL,
	`pending_categorization` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`gym` text,
	`instructor` text,
	`session_type` text NOT NULL,
	`gi_or_nogi` text,
	`duration_min` integer,
	`partners` text
);
