import { z } from 'zod';

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(), // e.g., "Skeptical Buyer", "Enthusiastic Seller"
  voiceId: z.string().optional(), // For TTS mapping later
  traits: z.array(z.string()).optional(),
});

export const SnippetRequestSchema = z.object({
  topic: z.string().min(3, "Topic is required"),
  format: z.string(),
  tone: z.string(),
  participants: z.array(ParticipantSchema),
  context: z.string().optional(), // Extra context like "It's raining", "Background noise: Cafe"
  language: z.string().optional(), // e.g., 'en', 'ru'
  userId: z.string().optional(), // optional user id to fetch profile language
});

export type Participant = z.infer<typeof ParticipantSchema>;
export type SnippetRequest = z.infer<typeof SnippetRequestSchema>;

export const DEFAULT_REQUEST: SnippetRequest = {
  topic: '',
  format: 'dialogue',
  tone: 'casual',
  participants: []
};

// Format categories for UI grouping
export const FORMAT_CATEGORIES = {
  conversation: ['dialogue', 'phone-call', 'interview', 'debate', 'negotiation'],
  solo: ['monologue', 'voicemail', 'presentation', 'tutorial'],
  broadcast: ['podcast', 'news', 'announcement']
};
