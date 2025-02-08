import {Hono} from "hono";
import sessionRoute from "./session.route.ts";
import messageRoute from "./message.route.ts";

const routeHandler = new Hono();

routeHandler.route("", sessionRoute)
routeHandler.route("", messageRoute)

export default routeHandler;