import fastifyCors from "@fastify/cors";
import { Config, Effect } from "effect";
import { FastifyApp } from "../services/server/fastify";

export class CorsConfig extends Effect.Service<CorsConfig>()(
	"app/config/CorsConfig",
	{
		effect: Effect.gen(function* () {
			const CLIENT_ORIGIN = yield* Config.string("CLIENT_ORIGIN").pipe(
				Config.withDefault("http://localhost:3000"),
			);
			const { register } = yield* FastifyApp;
			yield* Effect.logInfo(`Allowed CORS origins: ${CLIENT_ORIGIN}`);
			yield* register<never, never>(fastifyCors, {
				origin: CLIENT_ORIGIN,
				methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
				credentials: true,
				maxAge: 86400,
			});
			return Effect.void;
		}),
	},
) {}
