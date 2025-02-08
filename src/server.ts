import app from "./app.ts";
import {connectDatabase} from "./config/database.ts";
import log from "./utils/log.ts";
import {SessionService} from "./services/session.service.ts";


async function startServer() {
  await connectDatabase()
  SessionService.loadExistingSessions()
  log.info('Hono server started');
  Bun.serve(
      {
        fetch: app.fetch,
        port: 3000
      }
  )
}

startServer()