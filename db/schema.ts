import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const briefingArticles = sqliteTable("briefing_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueDate: text("issue_date").notNull(),
  region: text("region", { enum: ["us", "world"] }).notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type", { enum: ["email", "web"] }).notNull(),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
