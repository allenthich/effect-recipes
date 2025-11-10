import { NodeRuntime } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer } from "effect";
import { CorsConfig } from "./middleware/cors";
import { MainRoutes } from "./routes";
import { FastifyApp } from "./services/server/fastify";

const FastifyLive = MainRoutes.pipe(
	Layer.provide(CorsConfig.Default),
	Layer.provide(FastifyApp.Default),
);

const initializeServer = Effect.withConfigProvider(
	Layer.launch(FastifyLive),
	ConfigProvider.fromEnv(),
);

NodeRuntime.runMain(initializeServer);
