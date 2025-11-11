import { Rpc, RpcGroup } from "@effect/rpc"
import { Schema } from "effect"

// Define a user with an ID and name
export class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
}) {}

// Define input for creating a user
export class CreateUserInput extends Schema.Class<CreateUserInput>("CreateUserInput")({
  name: Schema.String,
  email: Schema.String
}) {}

// Define a group of RPCs for user management
export class UserRpcs extends RpcGroup.make(
  // Request to retrieve a list of users
  Rpc.make("UserList", {
    success: User,
    stream: true
  }),
  // Request to retrieve a user by ID
  Rpc.make("UserById", {
    success: User,
    error: Schema.String,
    payload: {
      id: Schema.String
    }
  }),
  // Request to create a new user
  Rpc.make("UserCreate", {
    success: User,
    payload: {
      name: Schema.String,
      email: Schema.String
    }
  })
) {}
