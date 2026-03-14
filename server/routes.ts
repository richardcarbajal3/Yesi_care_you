// Referenced from javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMotivationalMessage, generateDualPathPlan, analyzeImageForPrescription } from "./openai";
import { z } from "zod";
import { insertPatientSchema, insertChallengeSchema, insertSupportActivitySchema, insertCareProgramSchema, insertProgramStepSchema, insertSupportMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check (before auth, no authentication required)
  app.get('/api/health', (_req, res) => {
    res.json({ status: "ok" });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Patient profile routes
  app.get('/api/patient/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      res.status(500).json({ message: "Failed to fetch patient profile" });
    }
  });

  // Daily motivational message
  app.get('/api/patient/daily-message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      let message = await storage.getTodayMessage(patient.id);

      if (!message) {
        const generatedMessage = await generateMotivationalMessage(
          patient.fullName,
          patient.currentStreak,
          patient.totalPoints
        );

        message = await storage.createDailyMessage({
          patientId: patient.id,
          message: generatedMessage,
          messageDate: today,
        });
      }

      res.json({ message: message.message });
    } catch (error) {
      console.error("Error fetching daily message:", error);
      res.status(500).json({ message: "Failed to fetch daily message" });
    }
  });

  // Get today's challenge
  app.get('/api/patient/today-challenge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const challenge = await storage.getTodayChallenge(patient.id);
      res.json(challenge || null);
    } catch (error) {
      console.error("Error fetching today's challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  // Check if challenge completed today
  app.get('/api/patient/challenge-completed-today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const completed = await storage.checkChallengeCompletedToday(patient.id);
      res.json(completed);
    } catch (error) {
      console.error("Error checking challenge completion:", error);
      res.status(500).json({ message: "Failed to check completion" });
    }
  });

  // Complete challenge
  app.post('/api/patient/complete-challenge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { challengeId } = req.body;

      const patient = await storage.getPatientByUserId(userId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      // Create completion
      await storage.createChallengeCompletion({
        challengeId: challenge.id,
        patientId: patient.id,
        pointsEarned: challenge.points,
      });

      // Update patient points
      await storage.updatePatientPoints(patient.id, challenge.points);

      // Update streak
      const completedToday = await storage.checkChallengeCompletedToday(patient.id);
      if (completedToday) {
        await storage.updatePatientStreak(patient.id, patient.currentStreak + 1);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing challenge:", error);
      res.status(500).json({ message: "Failed to complete challenge" });
    }
  });

  // Skip challenge
  app.post('/api/patient/skip-challenge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Reset streak
      await storage.updatePatientStreak(patient.id, 0);

      res.json({ success: true });
    } catch (error) {
      console.error("Error skipping challenge:", error);
      res.status(500).json({ message: "Failed to skip challenge" });
    }
  });

  // Get all challenges for patient
  app.get('/api/patient/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const challenges = await storage.getChallengesByPatient(patient.id);
      const completions = await storage.getCompletionsByPatient(patient.id);

      const challengesWithCompletion = challenges.map(challenge => {
        const completion = completions.find(c => c.challengeId === challenge.id);
        return { ...challenge, completion };
      });

      res.json(challengesWithCompletion);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Get patient badges
  app.get('/api/patient/badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const patientBadges = await storage.getPatientBadges(patient.id);
      const allBadges = await storage.getAllBadges();

      const badgesWithDetails = patientBadges.map(pb => {
        const badge = allBadges.find(b => b.id === pb.badgeId);
        return { ...pb, badge };
      });

      res.json(badgesWithDetails);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Get consistency data
  app.get('/api/patient/consistency', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const completions = await storage.getCompletionsByPatient(patient.id);
      
      const consistencyData = completions.map(c => ({
        date: new Date(c.completedAt).toISOString().split('T')[0],
        completed: true,
      }));

      res.json(consistencyData);
    } catch (error) {
      console.error("Error fetching consistency:", error);
      res.status(500).json({ message: "Failed to fetch consistency" });
    }
  });

  // Get milestones
  app.get('/api/patient/milestones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const milestones: string[] = [];

      if (patient.totalPoints >= 100) {
        milestones.push("¡Has alcanzado 100 puntos! Tu dedicación es admirable.");
      }
      if (patient.currentStreak >= 7) {
        milestones.push("¡Una semana completa de consistencia! Esto es compromiso verdadero.");
      }
      if (patient.currentStreak >= 30) {
        milestones.push("¡30 días seguidos! Tu compromiso es tu mejor medicina.");
      }

      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Get completions history
  app.get('/api/patient/completions-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const completions = await storage.getCompletionsByPatient(patient.id);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  // Get support activities
  app.get('/api/patient/support-activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const activities = await storage.getSupportActivitiesByPatient(patient.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching support activities:", error);
      res.status(500).json({ message: "Failed to fetch support activities" });
    }
  });

  // Get active care program with steps
  app.get('/api/patient/care-program', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const program = await storage.getCareProgramWithSteps(patient.id);
      res.json(program || null);
    } catch (error) {
      console.error("Error fetching care program:", error);
      res.status(500).json({ message: "Failed to fetch care program" });
    }
  });

  // Complete a program step
  app.post('/api/patient/complete-step', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stepId } = req.body;

      const patient = await storage.getPatientByUserId(userId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const step = await storage.getProgramStep(stepId);
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }

      await storage.completeStep(stepId);
      
      // Award points for completing a step
      await storage.updatePatientPoints(patient.id, 15);
      await storage.updatePatientStreak(patient.id, patient.currentStreak + 1);

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing step:", error);
      res.status(500).json({ message: "Failed to complete step" });
    }
  });

  // Get support messages
  app.get('/api/patient/support-messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const messages = await storage.getSupportMessages(patient.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching support messages:", error);
      res.status(500).json({ message: "Failed to fetch support messages" });
    }
  });

  // Mark message as read
  app.post('/api/patient/mark-message-read', isAuthenticated, async (req: any, res) => {
    try {
      const { messageId } = req.body;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Nurse routes - Get all patients
  app.get('/api/nurse/patients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patients = await storage.getPatientsByNurse(userId);
      
      const patientsWithStats = await Promise.all(
        patients.map(async (patient) => {
          const completions = await storage.getCompletionsByPatient(patient.id);
          const challenges = await storage.getChallengesByPatient(patient.id);
          
          const completionRate = challenges.length > 0
            ? Math.round((completions.length / challenges.length) * 100)
            : 0;

          const lastActivity = completions.length > 0
            ? completions[0].completedAt.toISOString()
            : null;

          return {
            ...patient,
            completionRate,
            lastActivity,
          };
        })
      );

      res.json(patientsWithStats);
    } catch (error) {
      console.error("Error fetching nurse patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Nurse - Create patient
  app.post('/api/nurse/patients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const validated = insertPatientSchema.parse(req.body);

      const patient = await storage.createPatient({
        ...validated,
        nurseId: userId,
      });

      res.json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Nurse - Get patient detail
  app.get('/api/nurse/patient/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.id);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Nurse - Get patient challenges
  app.get('/api/nurse/patient/challenges/:patientId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const challenges = await storage.getChallengesByPatient(patient.id);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Nurse - Create challenge for patient
  app.post('/api/nurse/patient/:patientId/challenge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const validated = insertChallengeSchema.parse({
        ...req.body,
        patientId: patient.id,
      });

      const challenge = await storage.createChallenge(validated);
      res.json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Nurse - Get patient support activities
  app.get('/api/nurse/patient/support/:patientId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const activities = await storage.getSupportActivitiesByPatient(patient.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching support activities:", error);
      res.status(500).json({ message: "Failed to fetch support activities" });
    }
  });

  // Nurse - Create support activity for patient
  app.post('/api/nurse/patient/:patientId/support', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const validated = insertSupportActivitySchema.parse({
        ...req.body,
        patientId: patient.id,
      });

      const activity = await storage.createSupportActivity(validated);
      res.json(activity);
    } catch (error) {
      console.error("Error creating support activity:", error);
      res.status(500).json({ message: "Failed to create support activity" });
    }
  });

  // Nurse - Create care program for patient
  app.post('/api/nurse/patient/:patientId/care-program', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const { title, description, steps } = req.body;

      const program = await storage.createCareProgram({
        patientId: patient.id,
        title,
        description,
        source: 'nurse',
      });

      // Create steps
      if (steps && Array.isArray(steps)) {
        for (let i = 0; i < steps.length; i++) {
          await storage.createProgramStep({
            programId: program.id,
            orderIndex: i,
            title: steps[i].title,
            description: steps[i].description,
            duration: steps[i].duration,
          });
        }
      }

      const programWithSteps = await storage.getCareProgramWithSteps(patient.id);
      res.json(programWithSteps);
    } catch (error) {
      console.error("Error creating care program:", error);
      res.status(500).json({ message: "Failed to create care program" });
    }
  });

  // Nurse - Send support message to patient
  app.post('/api/nurse/patient/:patientId/message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const { message, stepId } = req.body;

      const supportMessage = await storage.createSupportMessage({
        patientId: patient.id,
        message,
        stepId: stepId || null,
        sender: 'yesi',
      });

      res.json(supportMessage);
    } catch (error) {
      console.error("Error sending support message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Nurse - Get patient care program
  app.get('/api/nurse/patient/:patientId/care-program', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Forbidden - Nurse access only" });
      }

      const patient = await storage.getPatient(req.params.patientId);
      
      if (!patient || patient.nurseId !== userId) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const program = await storage.getCareProgramWithSteps(patient.id);
      res.json(program || null);
    } catch (error) {
      console.error("Error fetching care program:", error);
      res.status(500).json({ message: "Failed to fetch care program" });
    }
  });

  // Admin simulation routes - Get all patients for simulation (public for demo)
  app.get('/api/admin/patients', async (req: any, res) => {
    try {
      const allPatients = await storage.getAllPatients();
      const patientsWithPrograms = await Promise.all(
        allPatients.map(async (patient) => {
          const program = await storage.getCareProgramWithSteps(patient.id);
          return {
            ...patient,
            programTitle: program?.title || null,
          };
        })
      );
      res.json(patientsWithPrograms);
    } catch (error) {
      console.error("Error fetching all patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Admin simulation - Get patient data by patient ID (public for demo)
  app.get('/api/admin/simulate/:patientId', async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const program = await storage.getCareProgramWithSteps(patient.id);
      const messages = await storage.getSupportMessages(patient.id);

      res.json({
        patient,
        program,
        messages,
      });
    } catch (error) {
      console.error("Error simulating patient:", error);
      res.status(500).json({ message: "Failed to simulate patient" });
    }
  });

  // Generate care plan from prescription/wish using AI (public for demo)
  app.post('/api/admin/generate-care-plan', async (req: any, res) => {
    try {
      const { prescriptionText, patientName, imageBase64, imageMimeType } = req.body;
      
      // Validate input sizes for security
      if (prescriptionText && prescriptionText.length > 5000) {
        return res.status(400).json({ message: "El texto es demasiado largo (máximo 5000 caracteres)" });
      }
      if (patientName && patientName.length > 100) {
        return res.status(400).json({ message: "El nombre es demasiado largo" });
      }
      if (imageBase64 && imageBase64.length > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "La imagen es demasiado grande (máximo 10MB)" });
      }
      
      let textToAnalyze = (prescriptionText || "").trim();
      
      // If image provided, analyze it first
      if (imageBase64) {
        try {
          const imageAnalysis = await analyzeImageForPrescription(imageBase64, imageMimeType || "image/jpeg");
          textToAnalyze = textToAnalyze ? `${textToAnalyze}\n\nAnálisis de imagen:\n${imageAnalysis}` : imageAnalysis;
        } catch (imgError) {
          console.error("Error analyzing image:", imgError);
          if (!textToAnalyze) {
            return res.status(400).json({ message: "No se pudo analizar la imagen. Por favor, describe el tratamiento manualmente." });
          }
        }
      }
      
      if (!textToAnalyze) {
        return res.status(400).json({ message: "Por favor proporciona una receta, tratamiento o deseo de cuidado" });
      }
      
      // Generate the dual path plan using AI
      const plan = await generateDualPathPlan(textToAnalyze, patientName || "Paciente");
      
      res.json({ plan, analyzedText: textToAnalyze });
    } catch (error) {
      console.error("Error generating care plan:", error);
      res.status(500).json({ message: "Error al generar el plan de cuidado" });
    }
  });

  // Create a new patient with AI-generated care plan (public for demo)
  app.post('/api/admin/create-patient-with-plan', async (req: any, res) => {
    try {
      const { patientName, plan } = req.body;
      
      if (!patientName || !plan) {
        return res.status(400).json({ message: "Nombre del paciente y plan son requeridos" });
      }
      
      // Validate plan structure
      if (!plan.title || !plan.steps || !Array.isArray(plan.steps) || plan.steps.length === 0) {
        return res.status(400).json({ message: "El plan debe tener título y pasos" });
      }
      
      // Generate a unique ID for the user
      const timestamp = Date.now();
      const uniqueUserId = `user-demo-${timestamp}`;
      
      // First, create a user record for the patient
      const user = await storage.upsertUser({
        id: uniqueUserId,
        email: `${patientName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}-${timestamp}@demo.local`,
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || '',
        role: 'patient',
      });
      
      // Create the patient profile (id is auto-generated by DB)
      // Using same userId as nurseId for demo purposes (self-managed patient)
      const patient = await storage.createPatient({
        userId: user.id,
        nurseId: user.id,
        fullName: patientName,
      });
      
      // Create the care program
      const program = await storage.createCareProgram({
        patientId: patient.id,
        title: plan.title,
        description: plan.description,
        source: 'ai',
      });
      
      // Create program steps and support messages
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const programStep = await storage.createProgramStep({
          programId: program.id,
          orderIndex: i,
          title: step.title,
          description: step.description,
          duration: step.duration,
        });
        
        // Create support message for this step
        await storage.createSupportMessage({
          patientId: patient.id,
          stepId: programStep.id,
          message: step.supportMessage,
          sender: 'yesi',
        });
      }
      
      // Get the complete program with steps
      const completeProgram = await storage.getCareProgramWithSteps(patient.id);
      const messages = await storage.getSupportMessages(patient.id);
      
      res.json({
        patient,
        program: completeProgram,
        messages,
      });
    } catch (error) {
      console.error("Error creating patient with plan:", error);
      res.status(500).json({ message: "Error al crear el paciente con su plan" });
    }
  });

  // Feedback routes (public - no auth required)
  app.post('/api/feedback', async (req: any, res) => {
    try {
      const { name, email, message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "El mensaje es requerido" });
      }
      if (message.length > 2000) {
        return res.status(400).json({ message: "El mensaje es demasiado largo (máximo 2000 caracteres)" });
      }

      const fb = await storage.createFeedback({
        name: name?.slice(0, 200) || null,
        email: email?.slice(0, 200) || null,
        message: message.trim(),
      });

      res.json({ success: true, id: fb.id });
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Error al enviar el comentario" });
    }
  });

  // Admin - Get all feedback
  app.get('/api/admin/feedback', async (req: any, res) => {
    try {
      const allFeedback = await storage.getAllFeedback();
      res.json(allFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Error al obtener los comentarios" });
    }
  });

  // Admin - Mark feedback as read
  app.post('/api/admin/feedback/:id/read', async (req: any, res) => {
    try {
      await storage.markFeedbackAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking feedback as read:", error);
      res.status(500).json({ message: "Error al marcar como leído" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
