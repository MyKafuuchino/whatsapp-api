import {Hono} from "hono";
import {SessionService} from "../services/session.service.ts";
import type {IResponseSuccess} from "../types/response.ts";
import {clients} from "../config/client.ts";
import {WhatsappService} from "../services/whatsapp.service.ts";

const sessionRoute = new Hono().basePath("/sessions");

sessionRoute.get("", (c) => {
  return c.json<IResponseSuccess>({
    success: true,
    message: "Get all session successfully",
    data: Object.keys(clients)
  })
})

sessionRoute.post("/create", async (c) => {
  const {phone} = await c.req.json();
  await SessionService.createClient(phone);
  return c.json<IResponseSuccess>({
    success: true,
    message: `Session created successfully. ${phone}`,
  })
})

sessionRoute.delete("/:id", async (c) => {
  const sessionId = c.req.param("id");
  await SessionService.deleteClient(sessionId);
  return c.json<IResponseSuccess>({
    success: true,
    message: `Session ${sessionId} deleted`,
  })
})

sessionRoute.get("/:id/qr", async (c) => {
  const sessionId = c.req.param("id")
  const response = await SessionService.getSessionQRStatus(sessionId);
  return c.json<IResponseSuccess>({
    success: true,
    message: `Get qr ${sessionId} successfully`,
    data: response
  })
})

export default sessionRoute;
