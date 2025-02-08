import app from "./app.ts";
import {connectDatabase} from "./config/database.ts";
import log from "./utils/log.ts";
import {SessionService} from "./services/session.service.ts";


async function startServer() {
  await connectDatabase()
  SessionService.loadExistingSessions()
  const port = Bun.env.PORT || 3000;
  log.info(`Hono server started ${port}`);
  Bun.serve(
      {
        fetch: app.fetch,
        port: port,
      }
  )
}

startServer()