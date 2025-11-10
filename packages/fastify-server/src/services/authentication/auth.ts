import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getConfigForCLI } from "./auth.config";
import * as schema from "./auth.schema";

/**
 * Standalone Better Auth instance for CLI and migrations
 *
 * This file is required for Better Auth CLI to discover the auth configuration
 * and generate proper database migrations.
 *
 * The CLI looks for files named `auth.ts` that export an `auth` instance.
 *
 * IMPORTANT: This file uses process.env for CLI compatibility.
 * For application runtime, use AuthService which provides Effect Config validation.
 *
 * Context separation:
 * - CLI context: This file → getConfigForCLI() → process.env (synchronous)
 * - Runtime context: AuthService → AuthConfig → Effect Config (validated)
 *
 * @see https://www.better-auth.com/docs/installation
 * @see https://www.better-auth.com/docs/concepts/cli
 */

// Get configuration for CLI context (synchronous, uses process.env)
const config = getConfigForCLI();

// Create database connection for Better Auth
const client = postgres(config.databaseUrl);
const db = drizzle(client, { schema });

/**
 * Better Auth instance
 * Must be exported as `auth` or default for CLI discovery
 */
export const auth = betterAuth({
	trustedOrigins: [config.clientOrigin],
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	secret: config.secret,
	baseURL: config.baseURL,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // TODO: Enable in production
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["line"]
		}
	},
	socialProviders: {
		line: {
			clientId: config.lineLoginChannelClientId,
			clientSecret: config.lineLoginChannelSecret,
			// Optional: override redirect if needed
			// redirectURI: "https://your.app/api/auth/callback/line",
			// scopes are prefilled: ["openid","profile","email"]. Append if needed
		},
	},
});
