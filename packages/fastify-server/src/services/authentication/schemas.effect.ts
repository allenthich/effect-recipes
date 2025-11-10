import { Schema } from "effect";
import type * as Types from "./auth.types";

/**
 * Effect Schemas derived from Drizzle types
 *
 * These schemas provide runtime validation for data coming from external sources
 * (API requests, external services, etc.) while staying aligned with database types.
 *
 * Key pattern: `satisfies Schema.Schema<DrizzleType>`
 * This ensures the Effect Schema structure matches the Drizzle type exactly.
 * TypeScript will error if they diverge.
 *
 * Use these schemas for:
 * - API request/response validation
 * - Runtime type checking
 * - Data serialization/deserialization
 * - External data parsing
 */

// ============================================================================
// DATABASE MODEL SCHEMAS
// ============================================================================

/**
 * User schema matching database structure
 * Use for validating user data from database or external sources
 */
export const UserSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	email: Schema.String,
	emailVerified: Schema.Boolean,
	image: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) satisfies Schema.Schema<Types.User, Types.User>;

/**
 * Session schema matching database structure
 * Use for validating session data
 */
export const SessionSchema = Schema.Struct({
	id: Schema.String,
	expiresAt: Schema.DateFromSelf,
	token: Schema.String,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	ipAddress: Schema.NullOr(Schema.String),
	userAgent: Schema.NullOr(Schema.String),
	userId: Schema.String,
}) satisfies Schema.Schema<Types.Session, Types.Session>;

/**
 * Account schema matching database structure
 * Use for validating OAuth account data
 */
export const AccountSchema = Schema.Struct({
	id: Schema.String,
	accountId: Schema.String,
	providerId: Schema.String,
	userId: Schema.String,
	accessToken: Schema.NullOr(Schema.String),
	refreshToken: Schema.NullOr(Schema.String),
	idToken: Schema.NullOr(Schema.String),
	accessTokenExpiresAt: Schema.NullOr(Schema.DateFromSelf),
	refreshTokenExpiresAt: Schema.NullOr(Schema.DateFromSelf),
	scope: Schema.NullOr(Schema.String),
	password: Schema.NullOr(Schema.String),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) satisfies Schema.Schema<Types.Account, Types.Account>;

/**
 * Verification schema matching database structure
 * Use for validating verification tokens
 */
export const VerificationSchema = Schema.Struct({
	id: Schema.String,
	identifier: Schema.String,
	value: Schema.String,
	expiresAt: Schema.DateFromSelf,
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) satisfies Schema.Schema<Types.Verification, Types.Verification>;

// ============================================================================
// API REQUEST SCHEMAS (Stricter than database)
// ============================================================================

/**
 * Sign up request schema
 * Validates user registration requests with stricter rules than database
 */
export const SignUpRequestSchema = Schema.Struct({
	email: Schema.String.pipe(
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), // Email format
		Schema.minLength(5),
		Schema.maxLength(255),
	),
	password: Schema.String.pipe(
		Schema.minLength(8, {
			message: () => "Password must be at least 8 characters",
		}),
		Schema.maxLength(128),
	),
	name: Schema.String.pipe(
		Schema.minLength(1, { message: () => "Name is required" }),
		Schema.maxLength(100),
		Schema.Trim,
	),
});

/**
 * Sign in request schema
 * Validates user login requests
 */
export const SignInRequestSchema = Schema.Struct({
	email: Schema.String.pipe(
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
			message: () => "Invalid email format",
		}),
	),
	password: Schema.String.pipe(Schema.nonEmptyString()),
});

/**
 * Update user request schema
 * Validates partial user updates (only updateable fields)
 */
export const UpdateUserRequestSchema = Schema.Struct({
	name: Schema.optional(
		Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100), Schema.trim),
	),
	image: Schema.optional(Schema.NullOr(Schema.String)),
});

// ============================================================================
// API RESPONSE SCHEMAS (Public data only)
// ============================================================================

/**
 * Public user schema
 * Exposes only safe user data for API responses (no sensitive fields)
 */
export const PublicUserSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	email: Schema.String,
	image: Schema.NullOr(Schema.String),
});

/**
 * Session response schema
 * Combined user and session data for authenticated responses
 */
export const SessionResponseSchema = Schema.Struct({
	user: PublicUserSchema,
	session: Schema.Struct({
		id: Schema.String,
		expiresAt: Schema.DateFromSelf,
	}),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Infer TypeScript types from Effect Schemas
 * Use these for function parameters and return types
 */
export type SignUpRequest = typeof SignUpRequestSchema.Type;
export type SignInRequest = typeof SignInRequestSchema.Type;
export type UpdateUserRequest = typeof UpdateUserRequestSchema.Type;
export type PublicUser = typeof PublicUserSchema.Type;
export type SessionResponse = typeof SessionResponseSchema.Type;
