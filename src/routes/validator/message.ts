import {z} from "zod";

export const sendMessageSchema = z.object({
  phone: z.string().min(1, {message: 'Phone number is required'}),
  message: z.string().min(1, {message: 'Message is required'}),
  sessionId: z.string().min(1, {message: 'SessionId is required'}),
})

export const sendMessageToPhonesSchema = z.object({
  phones: z.array(z.string().min(1, {message: 'Phone number is required'})),
  message: z.string().min(1, {message: 'Message is required'}),
  sessionId: z.string().min(1, {message: 'SessionId is required'}),
})

export const sendMessageAndImageSchema = z.object({
  image: z.instanceof(File),
  phone: z.string().min(1, {message: 'Phone number is required'}),
  message: z.string().optional(),
  sessionId: z.string().min(1, {message: 'SessionId is required'}),
  imageName: z.string().optional()
})

export type SendMessage = z.infer<typeof sendMessageSchema>
export type SendMessageToPhone = z.infer<typeof sendMessageToPhonesSchema>
export type SendMessageAndImage = z.infer<typeof sendMessageAndImageSchema>