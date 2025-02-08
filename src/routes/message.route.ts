import {Hono} from "hono";
import {WhatsappService} from "../services/whatsapp.service.ts";
import type {IResponseSuccess} from "../types/response.ts";
import {zValidator} from "@hono/zod-validator";
import {sendMessageAndImageSchema, sendMessageSchema, sendMessageToPhonesSchema} from "./validator/message.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import {HTTPException} from "hono/http-exception";

const messageRoute = new Hono().basePath("/whatsapp")

messageRoute.post("/send", zValidator("json", sendMessageSchema), async (c) => {
  const request = c.req.valid("json")
  const response = await WhatsappService.sendMessage(request)
  return c.json<IResponseSuccess>({
    success: true,
    message: response
  });
});

messageRoute.post("/sendToPhones", zValidator("json", sendMessageToPhonesSchema), async (c) => {
  const request = c.req.valid("json");
  const response = await WhatsappService.sendMessageToPhones(request)
  return c.json<IResponseSuccess>({
    success: true,
    message: response
  })
});

messageRoute.post("/sendImageAndMessage", zValidator("form", sendMessageAndImageSchema), async (c) => {
  const request = c.req.valid("form")

  const buffer = Buffer.from(await request.image.arrayBuffer());
  const fileName = `upload_${Date.now()}${path.extname(request.image.name)}`;
  const filePath = path.join("./public/images", fileName);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      throw new HTTPException(400, {message: "Error saving image : " + err.message})
    }
  });

  request.imageName = fileName;

  await WhatsappService.sendMessageAndImage(request)

  return c.json<IResponseSuccess>({
    success: true,
    message: "Success send image"
  })
})

export default messageRoute