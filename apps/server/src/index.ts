import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { appRouter } from "./routes";
import { createContext } from "./lib/context";
import { file } from "bun";
import path from "node:path";
import { env } from "./config/env";
import serverTiming from "@elysiajs/server-timing";
import { logger } from "@chneau/elysia-logger";


const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const port = Number(process.env.PORT) || 3000;

// @ts-ignore
const allowedOrigins = env.CORS_ORIGIN.split(",").map((url) => url.trim());

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(serverTiming())
  .use(logger())

  .options("/rpc*", () => new Response(null, { status: 204 }))

  .all("/rpc*", async (context) => {
    const { response } = await rpcHandler.handle(context.request, {
      prefix: "/rpc",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })

  .all("/api*", async (context) => {
    const { response } = await apiHandler.handle(context.request, {
      prefix: "/api",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })

  .get("/", () => "OK")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })
  .get("/syllabus", async () => {
    return await file(
      path.join(process.cwd(), "src/routes/syllabus/generated/university.json")
    ).json();
  })
export default app;