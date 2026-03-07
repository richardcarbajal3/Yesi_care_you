// Referenced from javascript_log_in_with_replit and javascript_database blueprints
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (IMPORTANT: Mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (IMPORTANT: Mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("patient"), // 'nurse' or 'patient'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patient profiles (managed by nurses)
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nurseId: varchar("nurse_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fullName: varchar("full_name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenges/Retos
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  points: integer("points").notNull().default(10),
  isDaily: boolean("is_daily").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge completions
export const challengeCompletions = pgTable("challenge_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  completedAt: timestamp("completed_at").defaultNow(),
  pointsEarned: integer("points_earned").notNull(),
});

// Badges/Insignias
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(), // lucide icon name
  requirement: integer("requirement").notNull(), // points or streak required
  type: varchar("type", { length: 20 }).notNull(), // 'points' or 'streak'
});

// Patient badges
export const patientBadges = pgTable("patient_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  badgeId: varchar("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Support activities (apoyo externo)
export const supportActivities = pgTable("support_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  activityDate: date("activity_date").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'treatment', 'medication', 'appointment', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Care Programs (receta/guía de cuidado)
export const carePrograms = pgTable("care_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  source: varchar("source", { length: 20 }).notNull().default("nurse"), // 'nurse' or 'ai'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Program Steps (pasos lineales del programa)
export const programSteps = pgTable("program_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => carePrograms.id, { onDelete: 'cascade' }),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: varchar("duration", { length: 50 }), // "1 día", "1 semana", etc.
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support Messages (mensajes puntuales de Yesi/IA)
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  stepId: varchar("step_id").references(() => programSteps.id, { onDelete: 'set null' }),
  message: text("message").notNull(),
  sender: varchar("sender", { length: 20 }).notNull().default("yesi"), // 'yesi' or 'ai'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback from users
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }),
  email: varchar("email", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily motivational messages
export const dailyMessages = pgTable("daily_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  messageDate: date("message_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedPatients: many(patients, { relationName: 'nurse_patients' }),
  patientProfile: many(patients, { relationName: 'user_patient' }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
    relationName: 'user_patient',
  }),
  nurse: one(users, {
    fields: [patients.nurseId],
    references: [users.id],
    relationName: 'nurse_patients',
  }),
  challenges: many(challenges),
  completions: many(challengeCompletions),
  badges: many(patientBadges),
  supportActivities: many(supportActivities),
  dailyMessages: many(dailyMessages),
  carePrograms: many(carePrograms),
  supportMessages: many(supportMessages),
}));

export const careProgramsRelations = relations(carePrograms, ({ one, many }) => ({
  patient: one(patients, {
    fields: [carePrograms.patientId],
    references: [patients.id],
  }),
  steps: many(programSteps),
}));

export const programStepsRelations = relations(programSteps, ({ one, many }) => ({
  program: one(carePrograms, {
    fields: [programSteps.programId],
    references: [carePrograms.id],
  }),
  supportMessages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  patient: one(patients, {
    fields: [supportMessages.patientId],
    references: [patients.id],
  }),
  step: one(programSteps, {
    fields: [supportMessages.stepId],
    references: [programSteps.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  patient: one(patients, {
    fields: [challenges.patientId],
    references: [patients.id],
  }),
  completions: many(challengeCompletions),
}));

export const challengeCompletionsRelations = relations(challengeCompletions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeCompletions.challengeId],
    references: [challenges.id],
  }),
  patient: one(patients, {
    fields: [challengeCompletions.patientId],
    references: [patients.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  patientBadges: many(patientBadges),
}));

export const patientBadgesRelations = relations(patientBadges, ({ one }) => ({
  patient: one(patients, {
    fields: [patientBadges.patientId],
    references: [patients.id],
  }),
  badge: one(badges, {
    fields: [patientBadges.badgeId],
    references: [badges.id],
  }),
}));

export const supportActivitiesRelations = relations(supportActivities, ({ one }) => ({
  patient: one(patients, {
    fields: [supportActivities.patientId],
    references: [patients.id],
  }),
}));

export const dailyMessagesRelations = relations(dailyMessages, ({ one }) => ({
  patient: one(patients, {
    fields: [dailyMessages.patientId],
    references: [patients.id],
  }),
}));

// Zod schemas for inserts
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  totalPoints: true,
  currentStreak: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions).omit({
  id: true,
  completedAt: true,
});
export type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export const insertPatientBadgeSchema = createInsertSchema(patientBadges).omit({
  id: true,
  earnedAt: true,
});
export type InsertPatientBadge = z.infer<typeof insertPatientBadgeSchema>;
export type PatientBadge = typeof patientBadges.$inferSelect;

export const insertSupportActivitySchema = createInsertSchema(supportActivities).omit({
  id: true,
  createdAt: true,
});
export type InsertSupportActivity = z.infer<typeof insertSupportActivitySchema>;
export type SupportActivity = typeof supportActivities.$inferSelect;

export const insertDailyMessageSchema = createInsertSchema(dailyMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertDailyMessage = z.infer<typeof insertDailyMessageSchema>;
export type DailyMessage = typeof dailyMessages.$inferSelect;

export const insertCareProgramSchema = createInsertSchema(carePrograms).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCareProgram = z.infer<typeof insertCareProgramSchema>;
export type CareProgram = typeof carePrograms.$inferSelect;

export const insertProgramStepSchema = createInsertSchema(programSteps).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
});
export type InsertProgramStep = z.infer<typeof insertProgramStepSchema>;
export type ProgramStep = typeof programSteps.$inferSelect;

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  isRead: true,
  createdAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
