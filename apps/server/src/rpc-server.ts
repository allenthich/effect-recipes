import { RpcServer } from "@effect/rpc"
import { Layer } from "effect"
import { UserRpcs } from "@effect-recipes/rpc"
import { UsersLive } from "./handlers.js"

// Create the RPC server layer
export const RpcLayer = RpcServer.layer(UserRpcs).pipe(
  Layer.provide(UsersLive)
)
