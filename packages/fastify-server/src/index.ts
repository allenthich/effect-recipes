import { NodeRuntime } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer } from "effect";
import { MainRoutes } from "./routes";
import { FastifyApp } from "./services/server/fastify";

const FastifyLive = Layer.provide(MainRoutes, [FastifyApp.Default]);

const initializeServer = Effect.withConfigProvider(
	Layer.launch(FastifyLive),
	ConfigProvider.fromEnv(),
);

NodeRuntime.runMain(initializeServer);
