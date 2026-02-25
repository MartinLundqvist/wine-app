import { fileURLToPath } from "node:url";
import path from "node:path";
import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { APP_NAME } from "@wine-app/shared";
import { registerReadRoutes } from "./routes/read.js";
import { registerWineStylesRoutes } from "./routes/wineStyles.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { requireAuth } from "./auth/preHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const webDistPath = path.resolve(__dirname, "..", "..", "web", "dist");

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(cookie);
if (isProduction) {
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: "/",
    wildcard: false,
  });
}
await registerAuthRoutes(app);

app.get("/health", async () => ({ ok: true, app: APP_NAME }));

if (!isProduction) {
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ message: "Wine API" });
  });
}

await registerReadRoutes(app);
await registerWineStylesRoutes(app);

app.get("/me", { preHandler: [requireAuth] }, async (req, reply) => {
  return reply.send({ user: req.user });
});

if (isProduction) {
  app.setNotFoundHandler((request, reply) => {
    if (request.method === "GET") {
      return reply.sendFile("index.html", webDistPath);
    }
    return reply.status(404).send({ error: "Not found" });
  });
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down…`);
    await app.close();
    process.exit(0);
  });
}
