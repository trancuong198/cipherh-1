import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Soul State table - tracks the autonomous agent's internal state
export const soulStates = pgTable("soul_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleCount: integer("cycle_count").notNull().default(0),
  mode: text("mode").notNull().default("idle"),
  doubts: integer("doubts").notNull().default(0),
  confidence: integer("confidence").notNull().default(75),
  energyLevel: integer("energy_level").notNull().default(100),
  anomalyScore: real("anomaly_score").notNull().default(0),
  learningRate: real("learning_rate").notNull().default(0.5),
  currentFocus: text("current_focus"),
  goalsLongTerm: jsonb("goals_long_term").default([]),
  personalityTraits: jsonb("personality_traits").default({}),
  reflection: text("reflection"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lessons learned by the agent
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  context: text("context"),
  learnedAt: timestamp("learned_at").defaultNow(),
});

// Actions performed by the agent
export const actions = pgTable("actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  cycle: integer("cycle").notNull(),
  anomalyScore: real("anomaly_score"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Anomalies detected by the agent
export const anomalies = pgTable("anomalies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  scoreImpact: integer("score_impact").notNull(),
  resolved: boolean("resolved").default(false),
  detectedAt: timestamp("detected_at").defaultNow(),
});

// Strategies proposed by the agent
export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task: text("task").notNull(),
  priority: text("priority").notNull(),
  reason: text("reason"),
  estimatedTime: text("estimated_time"),
  suggestedActions: jsonb("suggested_actions").default([]),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cycle logs for tracking Inner Loop execution
export const cycleLogs = pgTable("cycle_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycle: integer("cycle").notNull(),
  success: boolean("success").notNull(),
  logsRead: integer("logs_read").default(0),
  anomalyScore: real("anomaly_score").default(0),
  doubts: integer("doubts").default(0),
  confidence: integer("confidence").default(75),
  weeklyTasks: integer("weekly_tasks").default(0),
  questionsGenerated: integer("questions_generated").default(0),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Insert schemas
export const insertSoulStateSchema = createInsertSchema(soulStates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, learnedAt: true });
export const insertActionSchema = createInsertSchema(actions).omit({ id: true, executedAt: true });
export const insertAnomalySchema = createInsertSchema(anomalies).omit({ id: true, detectedAt: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true, createdAt: true });
export const insertCycleLogSchema = createInsertSchema(cycleLogs).omit({ id: true, executedAt: true });

// Types
export type InsertSoulState = z.infer<typeof insertSoulStateSchema>;
export type SoulState = typeof soulStates.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type Anomaly = typeof anomalies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertCycleLog = z.infer<typeof insertCycleLogSchema>;
export type CycleLog = typeof cycleLogs.$inferSelect;

// Legacy users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Enum for SoulMode
export type SoulMode = "idle" | "active" | "learning" | "reflecting" | "strategizing" | "doubting";
