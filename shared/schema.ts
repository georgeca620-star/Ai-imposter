import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomCode: varchar("room_code", { length: 6 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("lobby"), // lobby, discussion, voting, ended
  createdBy: varchar("created_by").notNull(),
  aiPersonality: varchar("ai_personality", { length: 20 }).notNull().default("casual"),
  discussionTimeLeft: timestamp("discussion_time_left"),
  votingTimeLeft: timestamp("voting_time_left"),
  aiPlayerId: varchar("ai_player_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  isAI: boolean("is_ai").notNull().default(false),
  isConnected: boolean("is_connected").notNull().default(true),
  vote: varchar("vote"), // player id they voted for
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  playerId: varchar("player_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
