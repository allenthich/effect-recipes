import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import {
	Cause,
	Config,
	Data,
	Effect,
	Exit,
	FiberId,
	FiberSet,
	Scope,
} from "effect";
import Fastify, {
	type FastifyPluginAsync,
	type FastifyPluginCallback,
	type FastifyPluginOptions,
	type FastifyRegisterOptions,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";
import { fastifyPlugin } from "fastify-plugin";

type HttpMethod = "delete" | "get" | "patch" | "post" | "put";

type FastifyPluginReturn = ReturnType<typeof fastifyPlugin>;

export class FastifyError extends Data.TaggedError("FastifyError")<{
	readonly message: string;
}> {}

export class FastifyApp extends Effect.Service<FastifyApp>()(
	"fastify-server/services/server/fastify/FastifyApp",
	{
		scoped: Effect.gen(function* () {
			const scope = yield* Effect.scope;
			const SERVER_HOST = yield* Config.string("SERVER_HOST");
			const SERVER_PORT = yield* Config.number("SERVER_PORT");

			const fastify = Fastify({
				logger: {
					// TODO: Disable for production
					transport: {
						target: "pino-pretty",
						options: {
							translateTime: "HH:MM:ss Z",
							ignore: "pid,hostname",
						},
					},
				},
			}).withTypeProvider<JsonSchemaToTsProvider>();

			// Register cleanup handler for when scope closes
			yield* Effect.addFinalizer(() =>
				Effect.async<void>((resume) => {
					fastify.close(() => resume(Effect.void));
				}),
			);

			// Helper to start listening (called AFTER routes are registered)
			const listen = () =>
				Effect.tryPromise({
					try: () =>
						fastify.listen({
							host: SERVER_HOST,
							port: SERVER_PORT,
						}),
					catch: (unknown) => {
						return new FastifyError({
							message: `${unknown} \n SERVER_HOST:SERVER_PORT=${SERVER_HOST}:${SERVER_PORT}`,
						});
					},
				});

			const plugin = <E, R>(
				...args: Parameters<typeof fastifyPlugin>
			): Effect.Effect<FastifyPluginReturn, E, R> =>
				Effect.sync(() => fastifyPlugin(...args));

			// Overloaded register to properly handle optional opts parameter
			function register<
				E = never,
				R = never,
				Options extends FastifyPluginOptions = FastifyPluginOptions,
			>(
				plugin: FastifyPluginCallback<Options> | FastifyPluginAsync<Options>,
			): Effect.Effect<void, E, R>;
			function register<
				E = never,
				R = never,
				Options extends FastifyPluginOptions = FastifyPluginOptions,
			>(
				plugin: FastifyPluginCallback<Options> | FastifyPluginAsync<Options>,
				opts: FastifyRegisterOptions<Options>,
			): Effect.Effect<void, E, R>;
			function register<
				E = never,
				R = never,
				Options extends FastifyPluginOptions = FastifyPluginOptions,
			>(
				plugin: FastifyPluginCallback<Options> | FastifyPluginAsync<Options>,
				opts?: FastifyRegisterOptions<Options>,
			): Effect.Effect<void, E, R> {
				return Effect.sync(() => {
					if (opts !== undefined) {
						return fastify.register(
							plugin as
								| FastifyPluginCallback<FastifyPluginOptions>
								| FastifyPluginAsync<FastifyPluginOptions>,
							opts,
						);
					}
					return fastify.register(
						plugin as
							| FastifyPluginCallback<FastifyPluginOptions>
							| FastifyPluginAsync<FastifyPluginOptions>,
					);
				});
			}

			// addRoute is a helper function to add routes to the Fastify app
			//
			// It handles the following:
			//
			// - Tracking the Effect fibers using a FiberSet
			// - Adding tracing information to each request
			// - Handling cases where the response has not been sent
			// - Logging any unhandled errors excluding interruptions
			// - Interrupting the fiber if the request is closed
			//
			const addRoute = <E, R>(
				method: HttpMethod | Array<HttpMethod>,
				path: string,
				handler: (
					request: FastifyRequest,
					rep: FastifyReply,
				) => Effect.Effect<void, E, R>,
			): Effect.Effect<void, never, R> =>
				Effect.gen(function* () {
					// Create runFork attached to the Layer scope
					const runFork = yield* FiberSet.makeRuntime<R>().pipe(
						Scope.extend(scope),
					);

					fastify.route({
						method,
						url: path,
						handler: (request, reply) => {
							const fiber = handler(request, reply).pipe(
								// Add tracing information to each request
								Effect.withSpan(`Fastify.route(${method}, ${path})`),
								// Handle cases where the response has not been sent
								Effect.onExit((exit) => {
									// Log any unhandled errors excluding interruptions
									if (
										Exit.isFailure(exit) &&
										!Cause.isInterruptedOnly(exit.cause)
									) {
										return Effect.annotateLogs(
											Effect.logWarning("Unhandled error in route", exit.cause),
											{
												method,
												path,
												headers: request.headers,
											},
										);
									}
									return Effect.void;
								}),
								runFork,
							);

							// Interrupt the fiber if the request is closes unexpectedly
							request.raw.on("close", () => {
								if (request.raw.destroyed) {
									fastify.log.info("Request closed");
									fiber.unsafeInterruptAsFork(FiberId.none);
								}
							});
						},
					});
				});

			return { fastify, addRoute, register, listen, plugin } as const;
		}),
	},
) {}
