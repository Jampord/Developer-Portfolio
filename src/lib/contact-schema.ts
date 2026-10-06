import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80, "Please keep your name under 80 characters"),
  email: z.string().trim().max(120, "Please keep your email under 120 characters").email("Please enter a valid email"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(2000, "Please keep it under 2000 characters"),
  // Honeypot: real users never see or fill this
  website: z.string().optional(),
});

export type ContactValues = z.infer<typeof contactSchema>;
