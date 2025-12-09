import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { aiClient, modelName } from '../lib/ai.js'
import { Variables } from '../types.js'

const app = new Hono<{ Variables: Variables }>()

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  }))
})

app.post('/', verifyFirebaseToken, zValidator('json', chatSchema), async (c) => {
  try {
    const { messages } = c.req.valid('json')

    if (!aiClient) {
      return c.json({ error: 'Azure OpenAI client is not initialized' }, 500)
    }

    const response = await aiClient.path('/chat/completions').post({
      body: {
        messages,
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        model: modelName
      }
    })

    if (response.status !== '200') {
      const respBody = response.body as { error?: unknown } | null;
      if (respBody?.error) {
        const errorMessage = typeof respBody.error === 'string' ? respBody.error : JSON.stringify(respBody.error);
        const errorToThrow = respBody.error instanceof Error ? respBody.error : new Error(errorMessage);
        throw errorToThrow;
      }
      throw new Error(`AI request failed with status ${response.status}`)
    }

    return c.json(response.body)
  } catch (error) {
    console.error('AI Error:', error)
    return c.json({ error: 'Failed to generate response' }, 500)
  }
})

export default app
