import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { APP_NAME } from "@wine-app/shared";
import { registerReadRoutes } from "./routes/read.js";
import { registerExerciseRoutes } from "./routes/exercise.js";
import { registerProgressRoutes } from "./routes/progress.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { requireAuth } from "./auth/preHandler.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(cookie);
await registerAuthRoutes(app);

app.get("/health", async () => ({ ok: true, app: APP_NAME }));

app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
  return reply.send({ message: "Wine API" });
});

await registerReadRoutes(app);
await registerExerciseRoutes(app);
await registerProgressRoutes(app);

app.get("/me", { preHandler: [requireAuth] }, async (req, reply) => {
  return reply.send({ user: req.user });
});

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
