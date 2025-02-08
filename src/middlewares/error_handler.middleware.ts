import {HTTPException} from "hono/http-exception";
import type {Context} from "hono";
import type {IResponseError} from "../types/response.ts";
import log from "../utils/log.ts";

export const errorHandler = (err: any, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json<IResponseError>({
      success: false,
      message: err.message,
    }, err.status);
  }
  log.error(err)
  return c.json<IResponseError>({
    message: "Internal server error", success: false
  }, 400)
}