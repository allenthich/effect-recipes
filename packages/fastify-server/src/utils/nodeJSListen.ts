import { createServer } from "node:http";
import type { HttpPlatform, HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer } from "effect";

export const nodeJSListen = (
	app: Layer.Layer<
		never,
		never,
		HttpPlatform.HttpPlatform | HttpServer.HttpServer
	>,
) =>
	Effect.gen(function* () {
		const SERVER_HOST = yield* Config.string("SERVER_HOST");
		const SERVER_PORT = yield* Config.number("SERVER_PORT");

		const ServerLive = NodeHttpServer.layer(() => createServer(), {
			host: SERVER_HOST,
			port: SERVER_PORT,
		});
		const MainLive = Layer.provide(app, ServerLive);
		const initialize = Layer.launch(MainLive);

		NodeRuntime.runMain(initialize);
		return yield* Effect.void;
	});
