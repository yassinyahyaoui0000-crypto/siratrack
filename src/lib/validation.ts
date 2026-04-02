import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const dailyLogSchema = z.object({
  deepWorkHours: z.number().min(0).max(24),
  codingProblemsSolved: z.number().int().min(0).max(500),
  projectWorkDone: z.boolean(),
  projectNotes: z.string().trim().max(280).default(""),
  learningMinutes: z.number().int().min(0).max(1440),
  workoutDone: z.boolean(),
  fajrDone: z.boolean(),
  dhuhrDone: z.boolean(),
  asrDone: z.boolean(),
  maghribDone: z.boolean(),
  ishaDone: z.boolean(),
  reflection: z.string().trim().max(200).default(""),
});

export const settingsSchema = z.object({
  deepWorkTargetHours: z.number().min(0.5).max(16),
  codingTargetProblems: z.number().int().min(0).max(100),
  learningTargetMinutes: z.number().int().min(0).max(600),
  requireProjectWork: z.boolean(),
  requireWorkout: z.boolean(),
  requireAllPrayers: z.boolean(),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const projectUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    progressPercent: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });
