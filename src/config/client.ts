import {Client} from "whatsapp-web.js";

interface SessionClients {
  [key: string]: Client;
}

export const clients: SessionClients = {};