import z from 'zod'

export const chatRequestSchema = z.object({
    prompt: z.string().trim().nonempty('Prompt is required'),
})
export type ChatRequest = z.infer<typeof chatRequestSchema>
