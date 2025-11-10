import { Data, Effect, Layer } from "effect";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CorsConfig } from "../middleware/cors";
import { auth } from "../services/authentication/auth";
import { FastifyApp } from "../services/server/fastify";
import { examplePlugin } from "../services/server/plugin";

export class FastifyRouteError extends Data.TaggedError("FastifyRouteError")<{
	readonly message: string;
}> {}

export const MainRoutes = Layer.scopedDiscard(
	Effect.gen(function* () {
		yield* CorsConfig;
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

		yield* addRoute(
			["get", "post"],
			"/api/auth/*",
			Effect.fnUntraced(function* (request, reply) {
				yield* Effect.tryPromise({
					try: async () => {
						// Construct request URL
						const url = new URL(request.url, `http://${request.headers.host}`);

						// Convert Fastify headers to standard Headers object
						const headers = new Headers();
						Object.entries(request.headers).forEach(([key, value]) => {
							if (value) headers.append(key, value.toString());
						});
						// Create Fetch API-compatible request
						const req = new Request(url.toString(), {
							method: request.method,
							headers,
							body: request.body ? JSON.stringify(request.body) : undefined,
						});
						// Process authentication request
						const response = await auth.handler(req);
						// Forward response to client
						reply.status(response.status);
						response.headers.forEach((value, key) => reply.header(key, value));
						reply.send(response.body ? await response.text() : null);
					},
					catch: (unknown) => {
						return new FastifyRouteError({
							message: `${unknown}`,
						});
					},
				});
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
