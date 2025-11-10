import { Config, Effect } from "effect";

/**
 * Default configuration values
 * Centralized defaults used by both Effect Config and CLI contexts
 */
const CONFIG_DEFAULTS = {
	secret: "development-secret-change-in-production",
	clientOrigin: "http://localhost:3000",
	baseURL: "http://localhost:8080",
	databaseHost: "localhost",
	databasePort: 5432,
	databaseUser: "postgres",
	databaseName: "fastify_server",
	lineLoginChannelClientId: "UNDEFINED",
	lineLoginChannelSecret: "UNDEFINED",
} as const;

/**
 * Build database URL from individual parameters or use DATABASE_URL
 */
const buildDatabaseUrl = (
	host: string,
	port: number,
	user: string,
	password: string,
	database: string,
): string => `postgres://${user}:${password}@${host}:${port}/${database}`;

/**
 * Authentication configuration using Effect Config
 * Provides type-safe, validated environment variables with proper defaults
 *
 * This is the source of truth for application runtime configuration.
 * The Better Auth CLI uses auth.ts which reads process.env directly.
 */
export class AuthConfig extends Effect.Service<AuthConfig>()(
	"app/config/AuthConfig",
	{
		effect: Effect.gen(function* () {
			// Use Config with proper defaults from centralized source
			const secret = yield* Config.redacted("BETTER_AUTH_SECRET").pipe(
				Config.withDefault(CONFIG_DEFAULTS.secret),
			);

			const clientOrigin = yield* Config.string("CLIENT_ORIGIN").pipe(
				Config.withDefault(CONFIG_DEFAULTS.clientOrigin),
			);

			const baseURL = yield* Config.string("BETTER_AUTH_URL").pipe(
				Config.withDefault(CONFIG_DEFAULTS.baseURL),
			);

			// Try DATABASE_URL first, fall back to individual parameters
			const hasDatabaseUrl = yield* Config.string("DATABASE_URL").pipe(
				Config.option,
			);

			const databaseUrl = yield* hasDatabaseUrl._tag === "Some"
				? Effect.succeed(hasDatabaseUrl.value)
				: Effect.gen(function* () {
						const host = yield* Config.string("DATABASE_HOST").pipe(
							Config.withDefault(CONFIG_DEFAULTS.databaseHost),
						);
						const port = yield* Config.number("DATABASE_PORT").pipe(
							Config.withDefault(CONFIG_DEFAULTS.databasePort),
						);
						const user = yield* Config.string("DATABASE_USER").pipe(
							Config.withDefault(CONFIG_DEFAULTS.databaseUser),
						);
						const password = yield* Config.redacted("DATABASE_PASSWORD").pipe(
							Config.withDefault(""),
						);
						const database = yield* Config.string("DATABASE_NAME").pipe(
							Config.withDefault(CONFIG_DEFAULTS.databaseName),
						);

						return buildDatabaseUrl(
							host,
							port,
							user,
							password.toString(),
							database,
						);
					});

			return {
				secret: secret.toString(),
				clientOrigin,
				baseURL,
				databaseUrl,
			};
		}),
	},
) {}

/**
 * Get configuration values using same defaults as Effect Config
 *
 * IMPORTANT: This is ONLY for Better Auth CLI compatibility.
 * The CLI must import auth.ts synchronously, so it can't use Effect Config.
 *
 * For application runtime, ALWAYS use AuthConfig (Effect Service) above.
 *
 * @internal - Only use in auth.ts for CLI compatibility
 */
export const getConfigForCLI = (): {
	secret: string;
	clientOrigin: string;
	baseURL: string;
	databaseUrl: string;
	lineLoginChannelClientId: string;
	lineLoginChannelSecret: string;
} => {
	// Use the same defaults as AuthConfig for consistency
	const secret = process.env.BETTER_AUTH_SECRET || CONFIG_DEFAULTS.secret;

	const clientOrigin =
		process.env.CLIENT_ORIGIN || CONFIG_DEFAULTS.clientOrigin;
	const baseURL = process.env.BETTER_AUTH_URL || CONFIG_DEFAULTS.baseURL;

	// Try DATABASE_URL first, fall back to building from parts
	const databaseUrl =
		process.env.DATABASE_URL ||
		buildDatabaseUrl(
			process.env.DATABASE_HOST || CONFIG_DEFAULTS.databaseHost,
			Number(process.env.DATABASE_PORT) || CONFIG_DEFAULTS.databasePort,
			process.env.DATABASE_USER || CONFIG_DEFAULTS.databaseUser,
			process.env.DATABASE_PASSWORD || "",
			process.env.DATABASE_NAME || CONFIG_DEFAULTS.databaseName,
		);

	const lineLoginChannelClientId =
		process.env.LINE_LOGIN_CHANNEL_CLIENT_ID ||
		CONFIG_DEFAULTS.lineLoginChannelClientId;
	const lineLoginChannelSecret =
		process.env.LINE_LOGIN_CHANNEL_SECRET ||
		CONFIG_DEFAULTS.lineLoginChannelSecret;

	return {
		secret,
		clientOrigin,
		baseURL,
		databaseUrl,
		lineLoginChannelClientId,
		lineLoginChannelSecret,
	};
};
