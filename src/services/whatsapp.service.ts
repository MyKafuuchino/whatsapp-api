import {prisma} from "../config/database.ts";
import {HTTPException} from "hono/http-exception";
import {clients} from "../config/client.ts";
import type {SendMessage, SendMessageAndImage, SendMessageToPhone} from "../routes/validator/message.ts";
import type {Session} from "@prisma/client";
import {MessageMedia} from "whatsapp-web.js";

export class WhatsappService {
  static async sendMessage({message, sessionId, phone}: SendMessage) {
    const session = await WhatsappRepository.findBySessionId(sessionId)
    const chatId = phone.endsWith("@c.us") ? phone : `${phone}@c.us`
    clients[session.sessionId].sendMessage(chatId, message);
    return "message sent successfully";
  }

  static async sendMessageToPhones({message, phones, sessionId}: SendMessageToPhone) {
    const session = await WhatsappRepository.findBySessionId(sessionId)
    const chatIds = phones.map(phone => phone.endsWith("@c.us") ? phone : `${phone}@c.us`);
    for (const chatId of chatIds) {
      await clients[session.sessionId].sendMessage(chatId, message);
    }
    return "messages sent successfully";
  }

  static async sendMessageAndImage({message, phone, sessionId, imageName}: SendMessageAndImage) {
    const session = await WhatsappRepository.findBySessionId(sessionId)
    const chatId = phone.endsWith("@c.us") ? phone : `${phone}@c.us`
    const media = MessageMedia.fromFilePath('./public/images/' + imageName);

    await clients[session.sessionId].sendMessage(chatId, media, {caption: message ? message : undefined});
  }
}

class WhatsappRepository {
  static async findBySessionId(sessionId: string): Promise<Session> {
    const existSession = await prisma.session.findUnique({where: {sessionId: sessionId}})
    if (!existSession) {
      throw new HTTPException(404, {message: "session not found"})
    }
    return existSession
  }
}
