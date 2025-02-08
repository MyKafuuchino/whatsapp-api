import {clients} from "../config/client.ts";
import {Client, LocalAuth} from "whatsapp-web.js";
import log from "../utils/log.ts";
import {HTTPException} from "hono/http-exception";
import {prisma} from "../config/database.ts";
import * as path from "node:path";
import * as fs from "node:fs";
import qrcode from "qrcode-terminal";

export class SessionService {
  static async loadExistingSessions() {
    const sessions = await prisma.session.findMany()

    if (sessions.length > 0) {
      sessions.forEach(session => {
        this.startClient(session.sessionId);
      });
    }
  };

  static async startClient(sessionId: string): Promise<Client> {
    if (clients[sessionId]) return clients[sessionId];

    return new Promise((resolve, reject) => {
      const client = new Client({
        authStrategy: new LocalAuth({clientId: sessionId})
      });

      client.on('qr', (qr: string) => {
        log.info(`QR Code for ${sessionId}:`);
        qrcode.generate(qr, {small: true})
      });

      client.on('ready', () => {
        log.info(`${sessionId} is ready!`);
        resolve(client);
      });

      client.on('authenticated', () => {
        log.info(`${sessionId} is authenticated!`);
      });

      client.on('auth_failure', (msg) => {
        log.error(`${sessionId} authentication failed:`, msg);
        reject(new Error(`Authentication failed for session: ${sessionId}`));
      });

      client.on('disconnected', async (reason) => {
        log.warning(`${sessionId} disconnected: ${reason}`);

        await clients[sessionId].destroy(); // Pastikan client dihancurkan dulu
        delete clients[sessionId]; // Hapus dari daftar clients
        log.info(`${sessionId} disconnected`);

        setTimeout(async () => {
          const sessionPath = path.join(__dirname, `../../.wwebjs_auth`, `session-${sessionId}`);
          if (fs.existsSync(sessionPath)) {
            try {
              await fs.promises.rm(sessionPath, {recursive: true, force: true});
              log.info(`Session folder deleted: ${sessionPath}`);
            } catch (e: any) {
              log.error(`Failed to delete session folder ${sessionPath}: ${e.message}`);
            }
          }
        }, 10000);
      });


      client.initialize();
      clients[sessionId] = client;
    });
  }

  static async createClient(sessionId: string) {
    if (!sessionId) throw new HTTPException(400, {message: "Session is required"});
    if (clients[sessionId]) throw new HTTPException(400, {message: "Session already exists"});
    await this.startClient(sessionId);
    await prisma.session.upsert({
      where: {
        sessionId: sessionId
      }, update: {
        sessionId: sessionId
      },
      create: {
        sessionId: sessionId
      }
    })
  }

  static async deleteClient(sessionId: string) {
    if (!sessionId) throw new HTTPException(400, {message: "Session is required"});
    await clients[sessionId].destroy()
    delete clients[sessionId];

    const sessionPath = path.join(__dirname, `../../.wwebjs_auth`, `session-${sessionId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, {recursive: true, force: true});
      log.info(`Session folder deleted: ${sessionPath}`);
    }
    await prisma.session.deleteMany({
      where: {sessionId: sessionId}
    });
    log.info(`Session ${sessionId} deleted successfully`);
  }
}