import type { HttpPlatform, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Layer } from "effect";

export const bunListen = (
	app: Layer.Layer<
		never,
		never,
		HttpPlatform.HttpPlatform | HttpServer.HttpServer
	>,
) =>
	Effect.gen(function* () {
		const SERVER_HOST = yield* Config.string("SERVER_HOST");
		const SERVER_PORT = yield* Config.number("SERVER_PORT");

		const ServerLive = BunHttpServer.layer({
			hostname: SERVER_HOST,
			port: SERVER_PORT,
		});
		const MainLive = Layer.provide(app, ServerLive);
		const initialize = Layer.launch(MainLive);

		BunRuntime.runMain(initialize);
		return yield* Effect.void;
	});
