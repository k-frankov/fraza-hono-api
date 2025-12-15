import { aiClient } from './ai.js';

export interface ProcessedChunk {
  original: string;
  translation: string;
}

export interface ProcessedScriptResponse {
  title: string;
  refinedScript: string;
  chunks: ProcessedChunk[];
}

export async function processScript(script: string, learningLanguage: string, nativeLanguage: string = 'English'): Promise<ProcessedScriptResponse> {
  const systemPrompt = `You are an expert script editor and translator specialized in language learning content.
Your goal is to prepare text for audio/voice narration and language practice.

TASKS:
1. Create a Title: Generate a short, descriptive title (5-10 words) that captures the main idea or educational focus of the script.
   - The title should be in ${nativeLanguage}.
   - Make it clear what the student will learn from this content.
   - Focus on the practical scenario or topic (e.g., "Ordering Coffee at a Busy Café", "Comparing Laptop Sizes at Tech Store").
2. "Voicification": Rewrite the input script to be more suitable for voice narration. 
   - Make it sound natural and conversational.
   - Improve flow and readability.
   - Keep it in the SAME language as the input (which should be ${nativeLanguage}).
   - Keep descriptive narration but make it PROSAIC, PRAGMATIC and CONCRETE. 
   - STRICTLY AVOID poetic, flowery, or overly lyrical descriptions. 
   - Focus on clear, observable details useful for language learning (materials, sizes, comparisons, actions).
   - REMOVE technical tags like [SCENE START], [SCENE END].
3. Chunking: Split the rewritten script into meaningful chunks.
   - Chunks should be short phrases or sentences (3-10 words ideal).
   - Suitable for turn-by-turn audio practice.
   - Include both dialogue and narration chunks.
4. Translation: Translate each chunk into ${learningLanguage}.
   - The translation should be accurate and natural.

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "title": "Short descriptive title in ${nativeLanguage}",
  "refinedScript": "The full rewritten script in ${nativeLanguage} (dialogue + narration, no tags)",
  "chunks": [
    {
      "original": "Chunk in ${nativeLanguage}",
      "translation": "Chunk translated to ${learningLanguage}"
    }
  ]
}`;

  const userPrompt = `Please process this script.
INPUT LANGUAGE: ${nativeLanguage}
TARGET LEARNING LANGUAGE: ${learningLanguage}

SCRIPT:
"${script}"`;

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
        temperature: 0.7,
        max_tokens: 4000,
      }
    });

    if (response.status !== '200') {
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const result = response.body as { choices?: Array<{ message?: { content?: string } }> };
    const raw = result.choices?.[0]?.message?.content || '';
    
    let parsed: ProcessedScriptResponse | null = null;

    try {
      parsed = JSON.parse(raw) as ProcessedScriptResponse;
    } catch {
      // Try to extract JSON from code blocks if present
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]) as ProcessedScriptResponse;
        } catch (e) {
          console.error('Failed to parse script processing response', e, { raw });
        }
      }
    }

    if (!parsed || !parsed.refinedScript || !Array.isArray(parsed.chunks)) {
      throw new Error('Invalid script processing response format');
    }

    // Filter out chunks that look like scene tags or are empty
    parsed.chunks = parsed.chunks.filter(chunk => {
      const text = chunk.original.trim();
      // Filter out [TAGS] and empty strings
      return text.length > 0 && !(text.startsWith('[') && text.endsWith(']'));
    });

    console.info('Script processing result:', JSON.stringify(parsed, null, 2));

    return parsed;
  } catch (error) {
    console.error('Script processing error:', error);
    throw error;
  }
}
