import {Hono} from "hono";
import {errorHandler} from "./middlewares/error_handler.middleware.ts";
import routeHandler from "./routes/_index.route.ts";

const app = new Hono();

app.route("", routeHandler);
app.onError(errorHandler)

export default app