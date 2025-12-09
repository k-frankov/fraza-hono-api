import ModelClient from '@azure-rest/ai-inference'
import { AzureKeyCredential } from '@azure/core-auth'

const key = process.env.AZURE_OPENAI_KEY || ''

if (!key) {
  console.warn('AZURE_OPENAI_KEY is not set')
}

// GPT-4o-mini for content generation
const contentEndpoint = 'https://frazaai.openai.azure.com/openai/deployments/gpt-4o-mini'
export const aiClient = key ? ModelClient(contentEndpoint, new AzureKeyCredential(key)) : null
export const modelName = 'gpt-4o-mini'

// GPT-4o for AI tutor (better conversational abilities)
const tutorEndpoint = 'https://frazaai.openai.azure.com/openai/deployments/gpt-4o'
export const tutorClient = key ? ModelClient(tutorEndpoint, new AzureKeyCredential(key)) : null
export const tutorModelName = 'gpt-4o'
