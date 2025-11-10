import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration for database migrations
 * Manages schema changes and migrations for PostgreSQL database
 *
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */
export default defineConfig({
	dialect: "postgresql",
	schema: ["./src/services/authentication/auth-schema.ts"],
	out: "./drizzle",
	dbCredentials: {
		host: process.env.DATABASE_HOST || "localhost",
		port: Number(process.env.DATABASE_PORT) || 5433,
		user: process.env.DATABASE_USER || "postgres",
		password: process.env.DATABASE_PASSWORD || "",
		database: process.env.DATABASE_NAME || "fastify_server",
	},
	verbose: true,
	strict: true,
});
