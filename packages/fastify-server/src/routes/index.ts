import { Effect, Layer } from "effect";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { FastifyApp } from "../services/server/fastify";
import { examplePlugin } from "../services/server/plugin";

export const MainRoutes = Layer.scopedDiscard(
	Effect.gen(function* () {
		const { fastify, addRoute, listen, register } = yield* FastifyApp;

		yield* Effect.logInfo("Registering routes...");

		// Register routes BEFORE calling listen()
		fastify.get("/", (_req, res) => {
			res.send({ message: "Hello, World!" });
		});

		yield* addRoute(
			"get",
			"/hello",
			Effect.fnUntraced(function* (request, reply) {
				reply.send({ message: "Hello, Hello!" });
			}),
		);

		async function exampleRoutes(
			fastify: FastifyInstance,
			_options: FastifyPluginOptions,
		) {
			fastify.get("/registered", async (_request, _reply) => {
				return { hello: "world" };
			});
		}

		yield* register<never, never>(exampleRoutes);
		yield* register<never, never>(examplePlugin);

		// Start server after route registration
		yield* listen();
	}),
);
