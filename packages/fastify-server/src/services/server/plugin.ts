import type { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { JSONSchema, Schema } from "effect";

/**
 * Helper to convert Effect Schema to Fastify-compatible JSON Schema
 *
 * This bridges Effect's type-safe schema system with Fastify's JSON Schema
 * type provider, enabling:
 * - Compile-time type safety from Effect schemas
 * - Runtime validation using Effect's Schema.decode
 * - Automatic JSON Schema generation for Fastify routes
 *
 * @example
 * ```ts
 * const UserSchema = Schema.Struct({
 *   id: Schema.String,
 *   email: Schema.String.pipe(Schema.pattern(/^.+@.+$/)),
 *   age: Schema.Number.pipe(Schema.positive())
 * });
 *
 * const { jsonSchema, validate } = toFastifySchema(UserSchema);
 *
 * fastify.post('/users', {
 *   schema: { body: jsonSchema }
 * }, async (req, reply) => {
 *   const result = validate(req.body);
 *   if (result._tag === 'Left') {
 *     reply.status(400).send({ error: 'Validation failed' });
 *     return;
 *   }
 *   const user = result.right; // Fully typed!
 * });
 * ```
 */
export function toFastifySchema<A, I, R>(schema: Schema.Schema<A, I, R>) {
	return {
		// JSON Schema for Fastify's type provider
		jsonSchema: JSONSchema.make(schema),

		// Type-safe validation function
		validate: Schema.decodeUnknownEither(schema),

		// Unsafe validation (throws on error) - use with Effect.try
		validateUnsafe: Schema.decodeUnknownSync(schema),

		// Extract TypeScript type
		_type: {} as A,
	} as const;
}

/**
 * Example schemas for common patterns
 */
export const CommonSchemas = {
	// Pagination
	Pagination: Schema.Struct({
		page: Schema.Number.pipe(Schema.positive()),
		limit: Schema.Number.pipe(Schema.positive(), Schema.lessThanOrEqualTo(100)),
	}),

	// ID parameter
	IdParam: Schema.Struct({
		id: Schema.String.pipe(Schema.minLength(1)),
	}),

	// Standard API response wrapper
	ApiResponse: <T extends Schema.Schema.Any>(dataSchema: T) =>
		Schema.Struct({
			success: Schema.Boolean,
			data: dataSchema,
			timestamp: Schema.Number,
		}),

	// Error response
	ErrorResponse: Schema.Struct({
		success: Schema.Literal(false),
		error: Schema.Struct({
			code: Schema.String,
			message: Schema.String,
			details: Schema.optional(Schema.Unknown),
		}),
	}),
};

/**
 * Example plugin demonstrating Effect Schema + Fastify integration
 */
export const examplePlugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify,
	_opts,
) => {
	// Define a schema
	const CreateUserSchema = Schema.Struct({
		name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
		email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
		age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150)),
	});

	const { jsonSchema, validate } = toFastifySchema(CreateUserSchema);

	// Use in route with full type safety
	fastify.post(
		"/users",
		{
			schema: {
				body: jsonSchema,
				response: {
					201: toFastifySchema(
						Schema.Struct({
							id: Schema.String,
							name: Schema.String,
							email: Schema.String,
							age: Schema.Number,
						}),
					).jsonSchema,
					400: toFastifySchema(CommonSchemas.ErrorResponse).jsonSchema,
				},
			},
		},
		async (req, reply) => {
			// Validate with Effect Schema for runtime safety
			const result = validate(req.body);

			if (result._tag === "Left") {
				reply.status(400).send({
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request body",
						details: result.left,
					},
				});
				return;
			}

			const userData = result.right;

			// Business logic here...
			const newUser = {
				id: crypto.randomUUID(),
				...userData,
			};

			reply.status(201).send(newUser);
		},
	);

	// Example with query parameters
	const GetUsersQuerySchema = CommonSchemas.Pagination;
	const getUsersQuery = JSONSchema.make(CommonSchemas.Pagination);

	fastify.get(
		"/users",
		{
			schema: {
				querystring: JSONSchema.make(CommonSchemas.Pagination),
			},
		},
		async (req, reply) => {
			const queryResult = Schema.decodeUnknownEither(GetUsersQuerySchema)(
				req.query,
			);

			if (queryResult._tag === "Left") {
				reply.status(400).send({
					success: false,
					error: {
						code: "INVALID_QUERY",
						message: "Invalid query parameters",
					},
				});
				return;
			}

			const { page, limit } = queryResult.right;

			// Fetch users with pagination...
			reply.send({
				success: true,
				data: {
					users: [],
					page,
					limit,
					total: 0,
				},
				timestamp: Date.now(),
			});
		},
	);
};
