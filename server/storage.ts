// Referenced from javascript_log_in_with_replit and javascript_database blueprints
import {
  users,
  patients,
  challenges,
  challengeCompletions,
  badges,
  patientBadges,
  supportActivities,
  dailyMessages,
  carePrograms,
  programSteps,
  supportMessages,
  feedback,
  type User,
  type UpsertUser,
  type Patient,
  type InsertPatient,
  type Challenge,
  type InsertChallenge,
  type ChallengeCompletion,
  type InsertChallengeCompletion,
  type Badge,
  type InsertBadge,
  type PatientBadge,
  type InsertPatientBadge,
  type SupportActivity,
  type InsertSupportActivity,
  type DailyMessage,
  type InsertDailyMessage,
  type CareProgram,
  type InsertCareProgram,
  type ProgramStep,
  type InsertProgramStep,
  type SupportMessage,
  type InsertSupportMessage,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  getPatientsByNurse(nurseId: string): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatientPoints(patientId: string, points: number): Promise<void>;
  updatePatientStreak(patientId: string, streak: number): Promise<void>;

  // Challenge operations
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallengesByPatient(patientId: string): Promise<Challenge[]>;
  getTodayChallenge(patientId: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;

  // Challenge completion operations
  getChallengeCompletion(challengeId: string, patientId: string): Promise<ChallengeCompletion | undefined>;
  getCompletionsByPatient(patientId: string): Promise<ChallengeCompletion[]>;
  checkChallengeCompletedToday(patientId: string): Promise<boolean>;
  createChallengeCompletion(completion: InsertChallengeCompletion): Promise<ChallengeCompletion>;

  // Badge operations
  getBadge(id: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  getPatientBadges(patientId: string): Promise<PatientBadge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  awardBadge(patientBadge: InsertPatientBadge): Promise<PatientBadge>;

  // Support activity operations
  getSupportActivitiesByPatient(patientId: string): Promise<SupportActivity[]>;
  createSupportActivity(activity: InsertSupportActivity): Promise<SupportActivity>;

  // Daily message operations
  getTodayMessage(patientId: string): Promise<DailyMessage | undefined>;
  createDailyMessage(message: InsertDailyMessage): Promise<DailyMessage>;

  // Care program operations
  getActiveCareProgram(patientId: string): Promise<CareProgram | undefined>;
  getCareProgramWithSteps(patientId: string): Promise<(CareProgram & { steps: ProgramStep[] }) | undefined>;
  createCareProgram(program: InsertCareProgram): Promise<CareProgram>;
  
  // Program step operations
  getProgramStep(id: string): Promise<ProgramStep | undefined>;
  getProgramSteps(programId: string): Promise<ProgramStep[]>;
  createProgramStep(step: InsertProgramStep): Promise<ProgramStep>;
  completeStep(stepId: string): Promise<void>;

  // Support message operations
  getSupportMessages(patientId: string): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  markMessageAsRead(messageId: string): Promise<void>;

  // Feedback operations
  getAllFeedback(): Promise<Feedback[]>;
  createFeedback(fb: InsertFeedback): Promise<Feedback>;
  markFeedbackAsRead(feedbackId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by ID or email
    const existingById = userData.id ? await this.getUser(userData.id) : null;
    const existingByEmail = userData.email 
      ? await db.select().from(users).where(eq(users.email, userData.email)).then(rows => rows[0])
      : null;
    
    // If user exists, update it
    if (existingById || existingByEmail) {
      const existingUser = existingById || existingByEmail!;
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    }
    
    // Otherwise insert new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Patient operations
  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async getPatientsByNurse(nurseId: string): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.nurseId, nurseId));
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatientPoints(patientId: string, points: number): Promise<void> {
    await db
      .update(patients)
      .set({ totalPoints: sql`${patients.totalPoints} + ${points}`, updatedAt: new Date() })
      .where(eq(patients.id, patientId));
  }

  async updatePatientStreak(patientId: string, streak: number): Promise<void> {
    await db
      .update(patients)
      .set({ currentStreak: streak, updatedAt: new Date() })
      .where(eq(patients.id, patientId));
  }

  // Challenge operations
  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getChallengesByPatient(patientId: string): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(eq(challenges.patientId, patientId))
      .orderBy(desc(challenges.createdAt));
  }

  async getTodayChallenge(patientId: string): Promise<Challenge | undefined> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the most recent challenge
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(and(
        eq(challenges.patientId, patientId),
        eq(challenges.isDaily, true)
      ))
      .orderBy(desc(challenges.createdAt))
      .limit(1);
    
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  // Challenge completion operations
  async getChallengeCompletion(challengeId: string, patientId: string): Promise<ChallengeCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(challengeCompletions)
      .where(
        and(
          eq(challengeCompletions.challengeId, challengeId),
          eq(challengeCompletions.patientId, patientId)
        )
      );
    return completion;
  }

  async getCompletionsByPatient(patientId: string): Promise<ChallengeCompletion[]> {
    return await db
      .select()
      .from(challengeCompletions)
      .where(eq(challengeCompletions.patientId, patientId))
      .orderBy(desc(challengeCompletions.completedAt));
  }

  async checkChallengeCompletedToday(patientId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [completion] = await db
      .select()
      .from(challengeCompletions)
      .where(
        and(
          eq(challengeCompletions.patientId, patientId),
          gte(challengeCompletions.completedAt, today)
        )
      )
      .limit(1);
    
    return !!completion;
  }

  async createChallengeCompletion(completion: InsertChallengeCompletion): Promise<ChallengeCompletion> {
    const [newCompletion] = await db
      .insert(challengeCompletions)
      .values(completion)
      .returning();
    return newCompletion;
  }

  // Badge operations
  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getPatientBadges(patientId: string): Promise<PatientBadge[]> {
    return await db
      .select()
      .from(patientBadges)
      .where(eq(patientBadges.patientId, patientId))
      .orderBy(desc(patientBadges.earnedAt));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async awardBadge(patientBadge: InsertPatientBadge): Promise<PatientBadge> {
    const [newPatientBadge] = await db
      .insert(patientBadges)
      .values(patientBadge)
      .returning();
    return newPatientBadge;
  }

  // Support activity operations
  async getSupportActivitiesByPatient(patientId: string): Promise<SupportActivity[]> {
    return await db
      .select()
      .from(supportActivities)
      .where(eq(supportActivities.patientId, patientId))
      .orderBy(desc(supportActivities.activityDate));
  }

  async createSupportActivity(activity: InsertSupportActivity): Promise<SupportActivity> {
    const [newActivity] = await db
      .insert(supportActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Daily message operations
  async getTodayMessage(patientId: string): Promise<DailyMessage | undefined> {
    const today = new Date().toISOString().split('T')[0];
    
    const [message] = await db
      .select()
      .from(dailyMessages)
      .where(
        and(
          eq(dailyMessages.patientId, patientId),
          eq(dailyMessages.messageDate, today)
        )
      )
      .limit(1);
    
    return message;
  }

  async createDailyMessage(message: InsertDailyMessage): Promise<DailyMessage> {
    const [newMessage] = await db
      .insert(dailyMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Care program operations
  async getActiveCareProgram(patientId: string): Promise<CareProgram | undefined> {
    const [program] = await db
      .select()
      .from(carePrograms)
      .where(and(
        eq(carePrograms.patientId, patientId),
        eq(carePrograms.isActive, true)
      ))
      .orderBy(desc(carePrograms.createdAt))
      .limit(1);
    return program;
  }

  async getCareProgramWithSteps(patientId: string): Promise<(CareProgram & { steps: ProgramStep[] }) | undefined> {
    const program = await this.getActiveCareProgram(patientId);
    if (!program) return undefined;

    const steps = await this.getProgramSteps(program.id);
    return { ...program, steps };
  }

  async createCareProgram(program: InsertCareProgram): Promise<CareProgram> {
    const [newProgram] = await db
      .insert(carePrograms)
      .values(program)
      .returning();
    return newProgram;
  }

  // Program step operations
  async getProgramStep(id: string): Promise<ProgramStep | undefined> {
    const [step] = await db.select().from(programSteps).where(eq(programSteps.id, id));
    return step;
  }

  async getProgramSteps(programId: string): Promise<ProgramStep[]> {
    return await db
      .select()
      .from(programSteps)
      .where(eq(programSteps.programId, programId))
      .orderBy(programSteps.orderIndex);
  }

  async createProgramStep(step: InsertProgramStep): Promise<ProgramStep> {
    const [newStep] = await db
      .insert(programSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async completeStep(stepId: string): Promise<void> {
    await db
      .update(programSteps)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(programSteps.id, stepId));
  }

  // Support message operations
  async getSupportMessages(patientId: string): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.patientId, patientId))
      .orderBy(desc(supportMessages.createdAt));
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [newMessage] = await db
      .insert(supportMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(eq(supportMessages.id, messageId));
  }

  // Feedback operations
  async getAllFeedback(): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  async createFeedback(fb: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(fb)
      .returning();
    return newFeedback;
  }

  async markFeedbackAsRead(feedbackId: string): Promise<void> {
    await db
      .update(feedback)
      .set({ isRead: true })
      .where(eq(feedback.id, feedbackId));
  }
}

export const storage = new DatabaseStorage();
