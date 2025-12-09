import { aiClient } from './ai.js';
import type { SnippetRequest } from './studio-types.js';

interface GenerateScriptOptions extends Omit<SnippetRequest, 'userId'> {
  temperature?: number;
  language?: string;
}

export async function generateScript(options: GenerateScriptOptions): Promise<string> {
  const { topic, format, tone, participants, context, temperature = 0.7, language = 'en' } = options;

  // Build the system prompt based on format and desired language
  const systemPrompt = buildSystemPrompt(format, tone, language);
  
  // Build the user prompt with all context (language-aware content will be handled by system prompt)
  const userPrompt = buildUserPrompt({ topic, format, participants, context, tone, language });

  if (!aiClient) {
    throw new Error('Azure OpenAI client is not initialized. Please check AZURE_OPENAI_KEY.');
  }

  try {
    const response = await aiClient.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: 2000,
      }
    });

    if (response.status !== '200') {
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const result = response.body as { choices?: Array<{ message?: { content?: string } }> };
    const script = result.choices?.[0]?.message?.content || '';
    
    if (!script) {
      throw new Error('No script generated');
    }

    return script;
  } catch (error) {
    console.error('Script generation error:', error);
    throw error;
  }
}

function buildSystemPrompt(format: string, tone: string, language?: string): string {
  const formatInstructions = {
    'dialogue': 'Write a natural conversation between the specified speakers. Use realistic dialogue tags and reactions.',
    'phone-call': 'Write a phone conversation. Include typical phone phrases like greetings, "Can you hear me?", etc.',
    'interview': 'Write an interview with clear questions and detailed answers. The interviewer should probe deeper.',
    'debate': 'Write a debate with opposing viewpoints. Each speaker should challenge the other\'s arguments.',
    'negotiation': 'Write a negotiation scene with give-and-take. Include offers, counteroffers, and compromises.',
    'monologue': 'Write a first-person narrative or speech. Make it engaging and personal.',
    'voicemail': 'Write a voicemail message. Keep it concise, include reason for calling and callback request.',
    'presentation': 'Write a formal presentation with clear structure: introduction, main points, conclusion.',
    'tutorial': 'Write step-by-step instructions. Be clear, sequential, and include helpful tips.',
    'podcast': 'Write a casual podcast segment. Include natural speech patterns, filler words, and enthusiasm.',
    'news': 'Write a news report. Use formal language, report facts, include who/what/when/where/why.',
    'announcement': 'Write a public announcement. Be clear, authoritative, and include necessary details.'
  };

  const instruction = formatInstructions[format as keyof typeof formatInstructions] || `Write content in the format of a ${format}. Adhere to the conventions and style typical for this format.`;

  // Determine if we should enforce strict script structure
  const isStandardScript = Object.keys(formatInstructions).includes(format);
  
  let structureSection = '';
  if (isStandardScript) {
    structureSection = [
      'STRUCTURE:',
      '- Include a brief, atmospheric scene description in parentheses at the beginning (setting the scene, describing initial actions).',
      '- For dialogues/interactions, include occasional action descriptions in parentheses between lines where appropriate.',
      '- DO NOT use [SCENE START] or [SCENE END] tags.'
    ].join('\n');
  } else {
    structureSection = [
      'STRUCTURE:',
      `- Follow the typical structure for a ${format}.`,
      '- DO NOT use [SCENE START] or [SCENE END] tags.',
      '- If it is a written format (like a post, email, article), just provide the content directly.'
    ].join('\n');
  }

  return `You are a language learning content creator specializing in ${format}.

LANGUAGE: ${language || 'English'} (Write the content in this language.)

TONE: ${tone}

FORMAT: ${instruction}

${structureSection}

VOCABULARY & STYLE:
- Use clear, practical, and descriptive language suitable for language learners.
- Avoid overly poetic, flowery, or abstract descriptions. Focus on concrete details and actions.
- Make it authentic and educational, but prioritize clarity over literary flair.
- Use idioms and phrasal verbs naturally where appropriate for the level.
- Incorporate common discourse markers and transition phrases.
- Ensure the language sounds natural for the chosen format.
- If generating dialogue/script: Format clearly with speaker names in CAPS followed by colon.
- If generating written text: Use appropriate formatting (paragraphs, emojis for social media, etc.).

GUIDELINES:
- Create engaging, realistic content that language learners will enjoy
- Use appropriate vocabulary for the level
- Make it culturally relevant and modern
- Keep it authentic to the requested format

Output only the content, nothing else.`;
}

function buildUserPrompt(options: {
  topic: string;
  format: string;
  participants: Array<{ name: string; role: string }>;
  context?: string;
  tone: string;
  language?: string;
}): string {
  const { topic, format, participants, context, tone } = options;

  let prompt = `Create a ${format} about: ${topic}\n\n`;

  if (participants && participants.length > 0) {
    if (participants.length > 1) {
      prompt += `SPEAKERS:\n`;
      participants.forEach(p => {
        prompt += `- ${p.name} (${p.role})\n`;
      });
      prompt += '\n';
    } else {
      prompt += `SPEAKER: ${participants[0].name} (${participants[0].role})\n\n`;
    }
  }

  if (context) {
    prompt += `CONTEXT: ${context}\n\n`;
  }

  prompt += `Make it ${tone} in tone.`;

  return prompt;
}
