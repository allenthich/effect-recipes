import type { Rpc } from "@effect/rpc";
import { Effect, Layer, Ref, Stream } from "effect";
import { User, UserRpcs } from "@effect-recipes/rpc";

// ---------------------------------------------
// User Repository (In-Memory Database)
// ---------------------------------------------

class UserRepository extends Effect.Service<UserRepository>()(
	"UserRepository",
	{
		effect: Effect.gen(function* () {
			const ref = yield* Ref.make<Array<User>>([
				new User({ id: "1", name: "Alice", email: "alice@example.com" }),
				new User({ id: "2", name: "Bob", email: "bob@example.com" }),
			]);

			return {
				findMany: ref.get,
				findById: (id: string) =>
					Ref.get(ref).pipe(
						Effect.andThen((users) => {
							const user = users.find((user) => user.id === id);
							return user
								? Effect.succeed(user)
								: Effect.fail(`User not found: ${id}`);
						}),
					),
				create: (name: string, email: string) => {
					const newUser = new User({
						id: String(Date.now()),
						name,
						email,
					});
					return Ref.update(ref, (users) => [...users, newUser]).pipe(
						Effect.as(newUser),
					);
				},
			};
		}),
	},
) {}

// ---------------------------------------------
// RPC Handlers
// ---------------------------------------------

export const UsersLive: Layer.Layer<
	Rpc.Handler<"UserList"> | Rpc.Handler<"UserById"> | Rpc.Handler<"UserCreate">
> = UserRpcs.toLayer(
	Effect.gen(function* () {
		const db = yield* UserRepository;

		return {
			UserList: () => Stream.fromIterableEffect(db.findMany),
			UserById: ({ id }) => db.findById(id),
			UserCreate: ({ name, email }) => db.create(name, email),
		};
	}),
).pipe(Layer.provide(UserRepository.Default));
