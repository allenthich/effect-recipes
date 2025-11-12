import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { UserRpcs } from "@effect-recipes/rpc";

// Protocol layer - configure the RPC client to use HTTP with serialization
const ProtocolLive = RpcClient.layerProtocolHttp({
	url: "http://localhost:3000/rpc",
}).pipe(
	Layer.provide(FetchHttpClient.layer),
	Layer.provide(RpcSerialization.layerNdjson),
);

// Create and export the RPC client service
export class UsersClient extends Effect.Service<UsersClient>()("UsersClient", {
	scoped: RpcClient.make(UserRpcs),
	dependencies: [ProtocolLive],
}) {}
