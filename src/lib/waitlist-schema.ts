import { z } from "zod";
import { en } from "@/features/deskcloud/content/en";

const { errors } = en.waitlist;

export const waitlistSchema = z.object({
  // Normalised so the same address can't be added twice with different casing
  email: z.string().trim().toLowerCase().max(120, errors.tooLong).email(errors.email),
  // Honeypot: real users never see or fill this
  website: z.string().optional(),
});

export type WaitlistInput = z.input<typeof waitlistSchema>;
export type WaitlistValues = z.output<typeof waitlistSchema>;
