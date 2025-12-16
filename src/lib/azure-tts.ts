import { uploadAudioFile } from './azure-storage.js';
import type { ProcessedChunk } from './script-processor.js';

const ttsKey = process.env.AZURE_TTS_KEY || '';
const ttsRegion = process.env.AZURE_TTS_REGION || 'swedencentral';

export interface TTSOptions {
  voiceName?: string;
  language?: string;
  gender?: 'Female' | 'Male';
  rate?: number; // Speech rate: 0.5 (slow) to 2.0 (fast), default 0.8 for learning
}

// Map language codes to appropriate Microsoft TTS voices
function getVoiceForLanguage(language: string): string {
  const lang = language.toLowerCase();
  
  if (lang.startsWith('fi')) return 'fi-FI-NooraNeural';
  if (lang.startsWith('en')) return 'en-US-AriaNeural';
  if (lang.startsWith('ru')) return 'ru-RU-SvetlanaNeural';
  if (lang.startsWith('es')) return 'es-ES-ElviraNeural';
  if (lang.startsWith('de')) return 'de-DE-KatjaNeural';
  if (lang.startsWith('fr')) return 'fr-FR-DeniseNeural';
  if (lang.startsWith('it')) return 'it-IT-ElsaNeural';
  if (lang.startsWith('pt')) return 'pt-BR-FranciscaNeural';
  if (lang.startsWith('ja')) return 'ja-JP-NanamiNeural';
  if (lang.startsWith('zh')) return 'zh-CN-XiaoxiaoNeural';
  if (lang.startsWith('ko')) return 'ko-KR-SunHiNeural';
  
  return 'en-US-AriaNeural'; // Default fallback
}

export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  if (!ttsKey) {
    throw new Error('AZURE_TTS_KEY is not set');
  }

  const {
    voiceName,
    language = 'en-US',
    gender = 'Female',
    rate = 0.8 // Slower for learning
  } = options;

  // Auto-select voice based on language if not specified
  const selectedVoice = voiceName || getVoiceForLanguage(language);

  const url = `https://${ttsRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

  // Convert rate to percentage for SSML (0.8 -> "-20%")
  const ratePercent = rate === 1.0 ? '0%' : `${Math.round((rate - 1) * 100)}%`;

  // Escape XML characters in text
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const ssml = `
<speak version='1.0' xml:lang='${language}'>
    <voice xml:lang='${language}' xml:gender='${gender}' name='${selectedVoice}'>
        <prosody rate='${ratePercent}'>
            ${escapedText}
        </prosody>
    </voice>
</speak>`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': ttsKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'FrazaWeb'
    },
    body: ssml
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

export async function generateAndSaveAudio(
  text: string,
  fileName: string,
  options: TTSOptions = {}
): Promise<string> {
  const audioBuffer = await synthesizeSpeech(text, options);
  const url = await uploadAudioFile(audioBuffer, fileName);
  return url;
}

export interface ChunkWithAudio {
  original: string;
  translation: string;
  originalAudioUrl?: string;
  translationAudioUrl?: string;
}

export async function processChunksWithAudio(
  chunks: ProcessedChunk[],
  basePath: string,
  options: { nativeLanguage: string; learningLanguage: string }
): Promise<ChunkWithAudio[]> {
  const results: ChunkWithAudio[] = [];

  // Process in parallel with concurrency limit to avoid rate limits
  // For simplicity, we'll do it sequentially or in small batches here
  // Azure TTS has concurrency limits (20 concurrent requests usually)
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkIndex = i + 1;
    const result: ChunkWithAudio = { ...chunk };

    try {
      // Generate audio for original text (Native Language - e.g., English)
      // Note: In the context of the app, "original" is usually the source script language (e.g. English)
      // and "translation" is the target learning language.
      // BUT, the `script-processor` defines:
      // original: Native Language (e.g. English)
      // translation: Learning Language (e.g. Finnish)
      
      // We usually want audio for the LEARNING language (translation).
      // Optionally for the native language too.
      
      // 1. Audio for Learning Language (Translation)
      if (chunk.translation) {
        const fileName = `${basePath}/chunk_${chunkIndex}_learning.mp3`;
        result.translationAudioUrl = await generateAndSaveAudio(
          chunk.translation,
          fileName,
          { language: options.learningLanguage, rate: 0.8 }
        );
      }

      // 2. Audio for Native Language (Original) - Optional, but good for reference
      if (chunk.original) {
        const fileName = `${basePath}/chunk_${chunkIndex}_native.mp3`;
        result.originalAudioUrl = await generateAndSaveAudio(
          chunk.original,
          fileName,
          { language: options.nativeLanguage, rate: 1.0 } // Normal speed for native
        );
      }

    } catch (error) {
      console.error(`Failed to generate audio for chunk ${i}:`, error);
      // Continue without audio for this chunk rather than failing the whole process
    }

    results.push(result);
  }

  return results;
}
