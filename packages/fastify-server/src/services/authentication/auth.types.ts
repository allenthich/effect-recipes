import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type * as schema from "./auth.schema";

/**
 * Types inferred from Drizzle schema
 *
 * These types are automatically synchronized with the database schema.
 * When you change the Drizzle schema, these types update automatically.
 *
 * Use these types throughout your application for type safety.
 */

// ============================================================================
// SELECT TYPES (What you get from database queries)
// ============================================================================

/**
 * User type from database
 * Represents a complete user record as retrieved from the database
 */
export type User = InferSelectModel<typeof schema.user>;

/**
 * Session type from database
 * Represents an active user session with device information
 */
export type Session = InferSelectModel<typeof schema.session>;

/**
 * Account type from database
 * Represents OAuth provider accounts and credentials
 */
export type Account = InferSelectModel<typeof schema.account>;

/**
 * Verification type from database
 * Represents email verification and password reset tokens
 */
export type Verification = InferSelectModel<typeof schema.verification>;

// ============================================================================
// INSERT TYPES (What you send to database for creation)
// ============================================================================

/**
 * New user insertion type
 * Used when creating new users (some fields may be optional/have defaults)
 */
export type NewUser = InferInsertModel<typeof schema.user>;

/**
 * New session insertion type
 * Used when creating new sessions
 */
export type NewSession = InferInsertModel<typeof schema.session>;

/**
 * New account insertion type
 * Used when creating new OAuth accounts
 */
export type NewAccount = InferInsertModel<typeof schema.account>;

/**
 * New verification insertion type
 * Used when creating verification tokens
 */
export type NewVerification = InferInsertModel<typeof schema.verification>;
