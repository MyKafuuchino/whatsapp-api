import {clients} from "../config/client.ts";
import {Client, LocalAuth} from "whatsapp-web.js";
import log from "../utils/log.ts";
import {HTTPException} from "hono/http-exception";
import {prisma} from "../config/database.ts";
import * as path from "node:path";
import * as fs from "node:fs";

export class SessionService {
  private static qrCodes: Map<string, string> = new Map();
  private static authenticated: Map<string, boolean> = new Map();

  static getQRCode(sessionId: string): string | undefined {
    return this.qrCodes.get(sessionId);
  }

  static isAuthenticated(sessionId: string): boolean {
    return this.authenticated.get(sessionId) || false;
  }

  static async loadExistingSessions() {
    const sessions = await prisma.session.findMany();

    if (sessions.length > 0) {
      for (const session of sessions) {
        try {
          await this.startClient(session.sessionId);
          // Set initial authentication state
          this.authenticated.set(session.sessionId, true);
        } catch (error) {
          log.error(`Failed to load session ${session.sessionId}:`, error);
          this.authenticated.set(session.sessionId, false);
        }
      }
    }
  }

  static async startClient(sessionId: string): Promise<Client> {
    if (clients[sessionId]) {
      this.authenticated.set(sessionId, true);
      return clients[sessionId];
    }

    return new Promise((resolve, reject) => {
      const client = new Client({
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ]
        },
        authStrategy: new LocalAuth({clientId: sessionId})
      });

      client.on('qr', (qr: string) => {
        log.info(`QR Code generated for ${sessionId}`);
        this.qrCodes.set(sessionId, qr);
        this.authenticated.set(sessionId, false);
      });

      client.on('ready', () => {
        log.info(`${sessionId} is ready!`);
        this.qrCodes.delete(sessionId);
        this.authenticated.set(sessionId, true);
        resolve(client);
      });

      client.on('authenticated', () => {
        log.info(`${sessionId} is authenticated!`);
        this.qrCodes.delete(sessionId);
        this.authenticated.set(sessionId, true);
      });

      client.on('auth_failure', (msg) => {
        log.error(`${sessionId} authentication failed:`, msg);
        this.authenticated.set(sessionId, false);
        this.qrCodes.delete(sessionId);
        reject(new Error(`Authentication failed for session: ${sessionId}`));
      });

      client.on('disconnected', async (reason) => {
        log.warning(`${sessionId} disconnected: ${reason}`);
        this.authenticated.set(sessionId, false);
        this.qrCodes.delete(sessionId);

        if (clients[sessionId]) {
          await clients[sessionId].destroy();
          delete clients[sessionId];
        }

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

  static async getSessionQRStatus(sessionId: string) {
    if (!sessionId) throw new HTTPException(400, {message: "Session ID is required"});

    const qrCode = this.qrCodes.get(sessionId);
    const client = clients[sessionId];
    const isAuth = this.isAuthenticated(sessionId);

    return {
      hasQR: !!qrCode,
      qrCode: qrCode,
      isAuthenticated: isAuth,
      status: client ? (isAuth ? 'authenticated' : 'pending') : 'inactive'
    };
  }

  static async createClient(sessionId: string) {
    if (!sessionId) throw new HTTPException(400, {message: "Session is required"});
    if (clients[sessionId]) throw new HTTPException(400, {message: "Session already exists"});

    await this.startClient(sessionId);
    await prisma.session.upsert({
      where: {
        sessionId: sessionId
      },
      update: {
        sessionId: sessionId
      },
      create: {
        sessionId: sessionId
      }
    });
  }

  static async deleteClient(sessionId: string) {
    if (!sessionId) throw new HTTPException(400, {message: "Session is required"});

    this.authenticated.delete(sessionId);
    this.qrCodes.delete(sessionId);

    if (clients[sessionId]) {
      await clients[sessionId].destroy();
      delete clients[sessionId];
    }

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